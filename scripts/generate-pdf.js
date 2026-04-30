import PDFDocument from 'pdfkit'
import fs from 'fs'

const doc = new PDFDocument()

doc.pipe(fs.createWriteStream('C:/Users/Corvus/.gemini/antigravity/brain/26a3ff83-f23f-45f9-badb-563d511dc645/Guia_DNS_Hostinger.pdf'))

doc.fontSize(20).text('Guia Rapida: Configuracion de Correos en Hostinger', { align: 'center' })
doc.moveDown()

doc.fontSize(12).text('Para que Kailu pueda enviar correos de confirmacion a los nuevos usuarios, necesitamos conectar nuestro proveedor de emails (Resend) con tu dominio en Hostinger.')
doc.moveDown()
doc.text('Solo tenes que copiar y pegar 4 registros en tu panel. Es muy rapido.')
doc.moveDown()

doc.fontSize(16).text('Paso 1: Ingresar a la Zona DNS')
doc.fontSize(12).text('1. Entra a tu cuenta de Hostinger.')
doc.text('2. Anda a la seccion Dominios y selecciona el dominio de Kailu.')
doc.text('3. En el menu de la izquierda, hace clic en DNS / Nameservers.')
doc.text('4. Vas a ver un formulario que dice "Administrar registros DNS".')
doc.moveDown()

doc.fontSize(16).text('Paso 2: Agregar los 4 registros')
doc.fontSize(12).text('Copia y pega cada uno de estos registros tal cual estan. Una vez que llenas los datos de uno, apretas el boton "Agregar Registro" y pasas al siguiente.')
doc.moveDown()

doc.fontSize(14).text('Registro 1: DKIM (TXT)')
doc.fontSize(12).text('Tipo: TXT')
doc.text('Nombre: resend._domainkey')
doc.text('Valor:')
doc.fontSize(10).font('Courier').text('p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCg2zmDszJeSoNrqV/8Q70D6vAHCZzz0njzutzXU6s6cjjnnf57l/0uMK+gl0L7F/1J3dJdNUsAwHelyPJVzSgI49TtZgTtWCNBvVOpk3/iNCiOOeCasTAVNbF7suMyhxOzB6GKoIOTFr3KRA6PkIfbbI/hOaaXXJiJPhhqYDv8awIDAQAB')
doc.font('Helvetica').moveDown()

doc.fontSize(14).text('Registro 2: SPF (MX)')
doc.fontSize(12).text('Tipo: MX')
doc.text('Nombre: send')
doc.text('Servidor de correo: feedback-smtp.sa-east-1.amazonses.com')
doc.text('Prioridad: 10')
doc.moveDown()

doc.fontSize(14).text('Registro 3: SPF (TXT)')
doc.fontSize(12).text('Tipo: TXT')
doc.text('Nombre: send')
doc.text('Valor:')
doc.fontSize(10).font('Courier').text('v=spf1 include:amazonses.com ~all')
doc.font('Helvetica').moveDown()

doc.fontSize(14).text('Registro 4: DMARC (TXT)')
doc.fontSize(12).text('Tipo: TXT')
doc.text('Nombre: _dmarc')
doc.text('Valor:')
doc.fontSize(10).font('Courier').text('v=DMARC1; p=none;')
doc.font('Helvetica').moveDown()

doc.fontSize(12).text('Nota: Si al escribir el nombre, Hostinger le agrega automaticamente tu dominio al lado (ej: send.kailu.travel), esta perfecto. Solo escribi la palabra corta.')
doc.moveDown()
doc.text('Listo! Una vez agregados los 4, avisanos. Los cambios en internet pueden tardar unos minutos en hacer efecto.')

doc.end()
console.log('PDF generado exitosamente.')
