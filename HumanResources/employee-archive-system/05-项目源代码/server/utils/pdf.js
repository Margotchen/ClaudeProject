const PdfPrinter = require('pdfmake');
const path = require('path');
const fs = require('fs');

// 将 pdfmake 内置的 Roboto 字体从 vfs_fonts.js 解压到本地 fonts/pdfmake/ 目录
const vfsFonts = require('pdfmake/build/vfs_fonts.js');
const pdfmakeFontDir = path.join(__dirname, '..', 'fonts', 'pdfmake');
if (!fs.existsSync(pdfmakeFontDir)) {
    fs.mkdirSync(pdfmakeFontDir, { recursive: true });
    for (const [name, base64] of Object.entries(vfsFonts)) {
        fs.writeFileSync(path.join(pdfmakeFontDir, name), Buffer.from(base64, 'base64'));
    }
}

// 如需中文显示，请在 server/fonts/ 下放置中文字体（如 SimHei.ttf）
const chineseFontPath = path.join(__dirname, '..', 'fonts', 'SimHei.ttf');
const hasChineseFont = fs.existsSync(chineseFontPath);

const fonts = hasChineseFont
    ? { SimHei: { normal: chineseFontPath, bold: chineseFontPath, italics: chineseFontPath, bolditalics: chineseFontPath } }
    : {
        Roboto: {
            normal: path.join(pdfmakeFontDir, 'Roboto-Regular.ttf'),
            bold: path.join(pdfmakeFontDir, 'Roboto-Medium.ttf'),
            italics: path.join(pdfmakeFontDir, 'Roboto-Italic.ttf'),
            bolditalics: path.join(pdfmakeFontDir, 'Roboto-MediumItalic.ttf')
        }
    };

const printer = new PdfPrinter(fonts);

/**
 * 生成员工花名册 PDF
 * @param {Array} data 员工数据
 * @param {Array} fields 导出字段配置 [{ key, label }]
 * @param {string} title 标题
 * @returns {Promise<Buffer>}
 */
function buildEmployeePdf(data, fields, title = '员工花名册') {
    const tableHeaders = fields.map(f => f.label);
    const tableBody = data.map(item => fields.map(f => String(item[f.key] ?? '')));

    const docDefinition = {
        content: [
            { text: title, style: 'header', alignment: 'center' },
            { text: `生成时间：${new Date().toLocaleString('zh-CN')}`, style: 'subheader', alignment: 'center' },
            { text: `共 ${data.length} 人`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: fields.map(() => 'auto'),
                    body: [tableHeaders, ...tableBody]
                }
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 10, margin: [0, 0, 0, 5] }
        },
        defaultStyle: {
            font: hasChineseFont ? 'SimHei' : 'Roboto',
            fontSize: 9
        }
    };

    return new Promise((resolve, reject) => {
        const chunks = [];
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
}

module.exports = { buildEmployeePdf };
