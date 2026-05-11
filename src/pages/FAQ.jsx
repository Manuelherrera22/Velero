import './FAQ.css'

export default function FAQ() {
  return (
    <div className="faq-page">
      <div className="container">
        <div className="faq-content glass animate-fade-in">
          <h1>Preguntas Frecuentes</h1>
          
          <section className="faq-section">
            <h2>Generales</h2>
            
            <div className="faq-item">
              <h3>¿Qué es Kailu?</h3>
              <p>Kailu es una plataforma que conecta personas con experiencias vinculadas a la navegación, la naturaleza y el encuentro con otras personas. A través de Kailu puedes descubrir y reservar actividades organizadas por capitanes, anfitriones y organizadores independientes, además de experiencias creadas o coordinadas directamente por Kailu.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cuál es el objetivo de Kailu?</h3>
              <p>Kailu busca facilitar el acceso a experiencias auténticas, ayudando a los capitanes y organizadores a dar visibilidad a sus propuestas y permitiendo que más personas puedan descubrir, reservar y vivir actividades únicas de manera simple y segura.</p>
            </div>

            <div className="faq-item">
              <h3>¿Quiénes pueden utilizar Kailu?</h3>
              <p>En Kailu existen distintos tipos de usuarios dentro de la plataforma:</p>
              <ul>
                <li><strong>Participantes</strong>, que reservan experiencias;</li>
                <li><strong>Capitanes u Organizadores</strong>, que publican actividades;</li>
                <li>y <strong>Aliados Kailu</strong>, que ayudan a difundir propuestas publicadas dentro de la plataforma y pueden acceder a beneficios o comisiones por reservas generadas a través de sus recomendaciones, conforme a las condiciones definidas por Kailu.</li>
              </ul>
            </div>

            <div className="faq-item">
              <h3>¿Es necesario registrarme para reservar?</h3>
              <p>No. No es necesario crear una cuenta en Kailu para realizar una reserva.</p>
              <p>Durante el proceso de contratación solicitaremos un correo electrónico y un número de teléfono para validar la reserva, enviar la confirmación correspondiente y poder contactarte en caso de ser necesario para la correcta coordinación de la experiencia.</p>
            </div>

            <div className="faq-item">
              <h3>¿Puedo crear un usuario en Kailu?</h3>
              <p>Sí. Los Capitanes u Organizadores y Aliados Kailu necesitarán crear un usuario para poder publicar experiencias, gestionar propuestas o participar de las funcionalidades específicas de la plataforma.</p>
              <p>Si deseas participar en actividades publicadas en Kailu, también podrás crear una cuenta para gestionar tus reservas y acceder a futuras funcionalidades, aunque actualmente no es obligatorio para realizar una contratación.</p>
            </div>

            <div className="faq-item">
              <h3>¿Necesito experiencia previa para participar?</h3>
              <p>No. Muchas experiencias están pensadas para personas sin experiencia previa. En cada actividad encontrarás información específica sobre requisitos o experiencia recomendada.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo puedo contactar a Kailu?</h3>
              <p>Puedes escribirnos en cualquier momento a: <strong>soporte@kailu.travel</strong></p>
              <p>También podrás encontrar novedades, contenidos y formas adicionales de contacto a través de los canales oficiales de Kailu.</p>
            </div>
          </section>

          <section className="faq-section">
            <h2>Para Participantes</h2>

            <div className="faq-item">
              <h3>¿Cómo puedo reservar una experiencia?</h3>
              <p>Solo debes seleccionar la actividad que te interese, elegir la fecha disponible y seguir el proceso de reserva indicado en la plataforma.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo funcionan los pagos?</h3>
              <p>Dependiendo de la experiencia, algunas reservas podrán abonarse completamente online y otras podrán requerir un anticipo para confirmar la plaza y el pago del saldo restante directamente al Capitán u Organizador.</p>
              <p>Las condiciones de pago se informarán antes de confirmar la reserva.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué incluye el precio de una experiencia?</h3>
              <p>Cada publicación detalla los servicios incluidos, horarios, duración y cualquier condición particular definida por el Capitán u Organizador.</p>
            </div>

            <div className="faq-item">
              <h3>¿Puedo cancelar una reserva?</h3>
              <p>Sí. Las condiciones de cancelación y devolución pueden variar según la experiencia contratada. Te recomendamos revisar las condiciones particulares de cada actividad antes de reservar.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué ocurre si una actividad se cancela por mal clima, razones de seguridad o fuerza mayor?</h3>
              <p>En esos casos, las partes podrán acordar una reprogramación o, cuando el participante no pueda asistir en la nueva fecha propuesta, se realizará la devolución de los importes abonados.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo me comunico con el Capitán u Organizador?</h3>
              <p>Dependiendo de la modalidad disponible en la plataforma, Kailu podrá ofrecer herramientas de comunicación entre usuarios o actuar como intermediario para facilitar el contacto y la coordinación de la experiencia.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué información debo proporcionar al reservar?</h3>
              <p>Para algunas actividades podremos solicitar datos como nombre, documento de identidad, información de contacto o datos relevantes para la seguridad y correcta organización de la experiencia.</p>
            </div>
          </section>

          <section className="faq-section">
            <h2>Para Capitanes u Organizadores</h2>

            <div className="faq-item">
              <h3>¿Cómo puedo publicar una experiencia en Kailu?</h3>
              <p>Debes registrarte en la plataforma y completar la información solicitada sobre la actividad, embarcación o experiencia que deseas ofrecer.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué modalidades de pago puedo ofrecer?</h3>
              <p>Dependiendo del tipo de experiencia, podrás optar por: cobro total online, o reserva mediante anticipo online y saldo restante abonado directamente por el participante al Capitán u Organizador.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cuándo recibo el dinero de una reserva?</h3>
              <p>Si el cobro lo realiza Kailu en su totalidad, el Capitán u Organizador recibe el importe dentro de las 48 hs posteriores a la concreción de la experiencia.</p>
              <p>Por otro lado, si la modalidad elegida es con anticipo, el Capitán u Organizador recibe el pago restante del participante al momento previo al inicio de la experiencia.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué ocurre si un participante cancela?</h3>
              <p>Las cancelaciones y posibles devoluciones se gestionarán según las condiciones particulares de cada experiencia y las políticas generales de Kailu.</p>
            </div>

            <div className="faq-item">
              <h3>¿Puedo cancelar una actividad?</h3>
              <p>Sí. En caso de condiciones climáticas adversas, razones de seguridad, fuerza mayor u otras situaciones que puedan afectar el correcto desarrollo de la experiencia, el Capitán u Organizador podrá cancelar o reprogramar la actividad.</p>
              <p>Kailu podrá revisar situaciones de cancelaciones reiteradas o injustificadas que afecten la experiencia de los participantes o el normal funcionamiento de la plataforma.</p>
            </div>

            <div className="faq-item">
              <h3>¿Qué información recibiré sobre los participantes?</h3>
              <p>Podrás acceder a la información necesaria para gestionar correctamente la experiencia, incluyendo datos de contacto, información relevante para la actividad y otros datos proporcionados por el participante dentro de los límites establecidos por Kailu.</p>
            </div>

            <div className="faq-item">
              <h3>¿Kailu cobra comisión?</h3>
              <p>Sí. Kailu cobra una comisión sobre las reservas realizadas a través de la plataforma, además de posibles gastos de gestión e impuestos aplicables.</p>
              <p>Actualmente, la comisión general para publicaciones estándar es del 20% sobre el valor de la experiencia, aunque determinadas actividades o modalidades podrán contar con condiciones particulares.</p>
              <p>Si tienes dudas sobre las condiciones aplicables a una propuesta, puedes escribirnos a: <strong>soporte@kailu.travel</strong></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
