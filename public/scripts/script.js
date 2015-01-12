var socket = io.connect(),
    nickname = '';

function addMessage(msg, nickname) {
    $('#chatEntries').append('<div class="message"><p>' + nickname + ' : ' + msg + '</p></div>');
}

function sendMessage() {
    if ($('#messageInput').val() !== "") {
        socket.emit('message', $('#messageInput').val());
        addMessage($('#messageInput').val(), nickname, new Date().toISOString(), true);
        $('#messageInput').val('');
    }
}

function setNickname() {
    $('#nicknameError').remove();
    if ($('#nicknameInput').val() !== "") {
        if ($('#nicknameAccordion').accordion('option', 'active') === 0) {
            nickname = $('#nicknameInput').val();
            socket.emit('setNickname', nickname);
            $('#chatControls').show();
            $('#nicknameDialog').dialog('close');
        } else {
            if ($('#roomInput').val() !== "") {
                nickname = $('#nicknameInput').val();
                socket.emit('setNickname', nickname);
                $('#chatControls').show();
                $('#nicknameDialog').dialog('close');
            } else {
                $('#nicknameDialog').append('<hr><div id="nicknameError" class="ui-state-error">Enter a room name!</div>');
            }
        }
    } else {
        $('#nicknameDialog').append('<hr><div id="nicknameError" class="ui-state-error">Enter a nickname!</div>');
    }
}

$(function() {
    $('#chatControls').hide();
    $('#nicknameInput').focus();
    $('#nicknameDialog').dialog({
        modal: true,
        autoOpen: true,
        open: function () {$('#nicknameAccordion').accordion({icons: false});},
        closeOnEscape: false,
        draggable: false,
        resizable: false,
        dialogClass: 'no-close',
        buttons: [{
            text:'Submit',
            click: function () {setNickname();}
        }]
    });
});

$(document).keypress(function(event) {
    if (event.which === 13) {
        event.preventDefault();
        if ($('#messageInput').is(':focus')) {
            sendMessage();
        } else if ($('#messageInput').is(':visible')) {
            $('#messageInput').focus();
        }
        else if ($('#nicknameInput').is(':focus') || $('#roomInput').is(':focus')) {
            setNickname();
        }
    }
});

socket.on('message', function(data) {
    addMessage(data['message'], data['nickname']);
});