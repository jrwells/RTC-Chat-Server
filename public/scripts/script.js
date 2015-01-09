var socket = io.connect(),
    nickname = '';

function addMessage(msg, nickname) {
    $('#chatEntries').append('<div class="message"><p>' + nickname + ' : ' + msg + '</p></div>');
}

function sendMessage() {
    if ($('#messageInput').val() != "") {
        socket.emit('message', $('#messageInput').val());
        addMessage($('#messageInput').val(), nickname, new Date().toISOString(), true);
        $('#messageInput').val('');
    }
}

function setNickname() {
    if ($('#nicknameInput').val() != "") {
        nickname = $('#nicknameInput').val();
        socket.emit('setNickname', nickname);
        $('#chatControls').show();
        $('#nicknameInput').hide();
        $('#nicknameSet').hide();
    }
}

$(function() {
    $('#chatControls').hide();
    $('#nicknameSet').click(function() {setNickname();});
    $('#submit').click(function() {sendMessage();});
});

$(document).keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        if ($('#messageInput').is(':focus')) {
            sendMessage();
        } else if ($('#nicknameInput').is(':focus')) {
            setNickname();
        }
    }
});

socket.on('message', function(data) {
    addMessage(data['message'], data['nickname']);
});