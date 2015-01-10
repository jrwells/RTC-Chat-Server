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
        $('#messageInput').focus();
        $('#nicknameInput').hide();
        $('#nicknameSet').hide();
    }
}

$(function() {
    $('#chatControls').hide();
    $('#nicknameInput').focus();
});

$(document).keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        if ($('#messageInput').is(':focus')) {
            sendMessage();
        } else if ($('#messageInput').is(':visible')) {
            $('#messageInput').focus();
        }
        else if ($('#nicknameInput').is(':focus')) {
            setNickname();
        } else {
            $('#nicknameInput').focus();
        }
    }
});

socket.on('message', function(data) {
    addMessage(data['message'], data['nickname']);
});