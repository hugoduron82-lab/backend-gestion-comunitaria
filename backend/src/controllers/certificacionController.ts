import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Organizacion from '../models/Organizacion';
import DirectivaMiembro from '../models/DirectivaMiembro';
import CargoDirectiva from '../models/CargoDirectiva';
import Configuracion from '../models/Configuracion';
import Certificacion from '../models/Certificacion';
import { registrarBitacora, obtenerIp } from '../services/loggerService';

// Helper para convertir parámetros de ruta (string | string[]) a número
const parseIdParam = (param: string | string[]): number => {
    const str = Array.isArray(param) ? param[0] : param;
    const num = parseInt(str, 10);
    if (isNaN(num)) throw new Error('ID inválido');
    return num;
};

// Asegurar que la carpeta de certificados existe
const UPLOAD_DIR = path.join(__dirname, '../../uploads/certificados');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const generarCertificado = async (req: AuthRequest, res: Response) => {
    try {
        const id_organizacion = parseIdParam(req.params.id_organizacion); // ← CORREGIDO
        const org = await Organizacion.findByPk(id_organizacion, {
            include: [
                { model: require('../models/Zona').default, as: 'zona' },
                { model: require('../models/TipoOrganizacion').default, as: 'tipo' }
            ]
        });
        if (!org) return res.status(404).json({ msg: 'Organización no encontrada' });

        const directiva = await DirectivaMiembro.findAll({
            where: { id_organizacion, activo: true },
            include: [{ model: CargoDirectiva, as: 'cargo' }],
            order: [[{ model: CargoDirectiva, as: 'cargo' }, 'orden', 'ASC']]
        });

        if (directiva.length === 0) {
            return res.status(400).json({ msg: 'La organización no tiene directiva activa' });
        }

        // Obtener correlativo desde configuración
        let configCorrelativo = await Configuracion.findOne({ where: { clave: 'correlativo_certificaciones' } });
        let correlativo = configCorrelativo ? parseInt(configCorrelativo.valor) + 1 : 1;
        const numeroCertificado = `CERT-${org.id}-${correlativo}`;

        // Generar PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `cert_${numeroCertificado}.pdf`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Configuración de la municipalidad
        const nombreInstitucion = (await Configuracion.findOne({ where: { clave: 'nombre_institucion' } }))?.valor || 'Municipalidad';
        const cargoFirmante = (await Configuracion.findOne({ where: { clave: 'cargo_firmante_pdf' } }))?.valor || 'Jefe de Desarrollo Comunitario';
        const nombreFirmante = (await Configuracion.findOne({ where: { clave: 'nombre_firmante_pdf' } }))?.valor || 'Funcionario';

        // Construir PDF
        doc.fontSize(18).text(nombreInstitucion, { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text('CERTIFICADO DE VIGENCIA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();
        doc.text(`La organización ${org.nombre}`, { continued: true });
        doc.text(`, con número de inscripción Tomo ${org.tomo || 'N/A'} Folio ${org.folio || 'N/A'}, `);
        doc.text(`ubicada en ${org.colonia_sector || (org as any).zona?.nombre || 'N/A'}, `);
        doc.text(`tipo ${(org as any).tipo?.nombre || 'N/A'}, tiene vigencia hasta ${new Date(org.fecha_vencimiento).toLocaleDateString()}.`);
        doc.moveDown();
        doc.text('La directiva actual está conformada por:');
        directiva.forEach(m => {
            doc.text(`- ${(m as any).cargo?.nombre}: ${m.nombre_completo} (DNI: ${m.dni})`);
        });
        doc.moveDown();
        doc.text(`Certificado N°: ${numeroCertificado}`);
        doc.moveDown();
        doc.text(`Firmado por: ${nombreFirmante}`, { align: 'right' });
        doc.text(`${cargoFirmante}`, { align: 'right' });

        doc.end();

        stream.on('finish', async () => {
            const certificacion = await Certificacion.create({
                id_organizacion: org.id,
                numero_certificado: numeroCertificado,
                generado_por: req.usuario!.id,
                ruta_archivo: filePath,
                observaciones: `Generado por ${req.usuario!.correo}`
            });

            if (configCorrelativo) {
                await configCorrelativo.update({ valor: correlativo.toString() });
            } else {
                // Ahora el id es opcional, gracias a la interfaz corregida
                await Configuracion.create({
                    clave: 'correlativo_certificaciones',
                    valor: correlativo.toString(),
                    descripcion: 'Último correlativo'
                });
            }

            await registrarBitacora(
                req.usuario!.id,
                'certificaciones',
                'GENERAR_PDF',
                certificacion.id,
                `Certificado ${numeroCertificado} generado para organización ${org.nombre}`,
                obtenerIp(req)
            );

            res.download(filePath, fileName);
        });

        stream.on('error', (err) => {
            console.error('Error al escribir el PDF:', err);
            res.status(500).json({ msg: 'Error al generar el archivo PDF' });
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ msg: 'Error al generar certificado', error: err.message });
    }
};