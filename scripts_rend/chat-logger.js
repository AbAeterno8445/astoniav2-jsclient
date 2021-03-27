const div_chatbox = document.getElementById('div-chatbox');

var log_elems = [];
function chat_logmsg(msg) {
    var span_log = document.createElement('span');
    span_log.innerHTML = msg;

    div_chatbox.appendChild(span_log);
    div_chatbox.appendChild(document.createElement('br'));

    log_elems.push(span_log);
}