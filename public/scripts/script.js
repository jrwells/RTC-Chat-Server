var socket = io.connect(),
    nickname = '',
    room = '';

function dialogError(error) {
    $('#nicknameDialog').append('<div id="errDivider"><hr><div id="nicknameError" class="ui-state-error">' + error + '</div></div>');
}

function addMessage(msg, nickname) {
    $('#chatEntries').append('<div class="message"><p>' + nickname + ' : ' + msg + '</p></div>');
}

function addNotification(notification) {
    $('#chatEntries').append('<div class="notification"><p>' + notification + '</p></div>');
}

function sendMessage() {
    if ($('#messageInput').val() !== "") {
        socket.emit('message', $('#messageInput').val());
        addMessage($('#messageInput').val(), nickname);
        $('#messageInput').val('');
    }
}

function checkRoomName() {
    var rn = $('#roomInput').val();
    socket.emit('checkRoom', rn, function (data) {
        if (data.valid) {
            room = rn;
            processInfo();
        } else {
            dialogError('Invalid room name!');
        }
    });
}

function getRoomName() {
    socket.emit('getRoomName', function (data) {
        $('#newRoomText').append('Your room\'s name is:<div id="roomName">' + data.name + '</div>');
        room = data.name;
    });
}

function processInfo() {
    socket.emit('setNickname', $('#nicknameInput').val());
    nickname = $('#nicknameInput').val();
    socket.emit('joinRoom', room, function (data) {
        $('#chatControls').show();
        $('#nicknameDialog').dialog('close');
    });
}

function handleInfo() {
    $('#nicknameError').remove();
    $('#errDivider').remove();
    if ($('#nicknameInput').val() !== "") {
        if ($("#nicknameAccordion").accordion("option", "active") !== false) {
            if ($('#nicknameAccordion').accordion('option', 'active') === 0) {
                processInfo();
            } else {
                if ($('#roomInput').val() !== "") {
                    checkRoomName();
                    processInfo();
                } else {
                    dialogError('Enter a room name!');
                }
            }
        } else {
            dialogError('Choose an option!');
        }
    } else {
        dialogError('Enter a nickname!');
    }
}

$(function() {
    $('#chatControls').hide();
    $('#nicknameInput').focus();
    $('#nicknameDialog').dialog({
        modal: true,
        autoOpen: true,
        open: function () {$('#nicknameAccordion').accordion({icons: false, active: false});},
        closeOnEscape: false,
        draggable: false,
        resizable: false,
        dialogClass: 'no-close',
        buttons: [{
            text:'Submit',
            click: function () {handleInfo();}
        }]
    });
    getRoomName();
});

$(document).keypress(function (event) {
    if (event.which === 13) {
        event.preventDefault();
        if ($('#messageInput').is(':focus')) {
            sendMessage();
        } else if ($('#messageInput').is(':visible')) {
            $('#messageInput').focus();
        }
        else if ($('#nicknameInput').is(':focus') || $('#roomInput').is(':focus')) {
            handleInfo();
        }
    }
});

socket.on('message', function (data) {
    addMessage(data['message'], data['nickname']);
});

socket.on('notification', function (data) {
    addNotification(data['notification']);
});