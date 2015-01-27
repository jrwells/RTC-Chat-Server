// Initiate socket connection and define important variables
var socket = io.connect(),
    gNickname = '', // Global user's current nickname.
    gID = '',
    gRoom = ''; // Global user's current room.


// Variables used for temporary storage.
var tRoom = ''; // Stores the room that the server generates for the user.


// Used to store the last messenge sender.
var lastSender = '',
    lastSenderID = '';


// Universal UI functions


/**
 * Display's an alert notifying the user that his/her browser does not support WebRTC.
 */
function webrtcIncompatible() {

}

/**
 * Clears all errors.
 */
function clearErrors() {
    $('.chat-error').remove();
}

/**
 * Throw an error in a given element.
 * @element {DOM element} The element on which to append the error.
 * @error {string} A short message about the type of error.
 */
function throwError(element, error) {
    element.append('<div class="chat-error">' + error + '</div>');
}

/**
 * Clears all warnings.
 */
function clearWarnings() {
    $('.chat-warning').remove();
}

/**
 * Throw a warning in a given element.
 * @element {DOM element} The element on which to append the warning.
 * @warning {string} A short message about the type of warning.
 */
function throwWarning(element, warning) {
    element.append('<div class="chat-warning">' + warning + '</div>');
}


// User connection validation functions


/**
 * Perform local validation of the nickname-input field.
 * Displays an error if one exists, and success if one does not.
 * @return {boolean} returns false on error and true on success.
 */
function validateName() {
    if (!$('#nickname-input').val()) {
        nameError('Must Enter a Nickname!');
        return false;
    } else if ($('#nickname-input').val().length < 3) {
        nameError('Nickname must be at least 3 characters!');
        return false;
    } else if ($('#nickname-input').val().length > 9) {
        nameError('Nickname must be less than 10 characters!');
        return false;
    } else {
        nameSuccess();
        return true;
    }
}

/**
 * Performs only the local validation of the room-input field.
 * (Does not check the server for the room's existence.)
 * Displays an error if one exists, and success if one does not.
 * @return {boolean} returns false on error  and true on success.
 */
function validateRoom() {
    if (!$('#room-input').val()) {
        roomError('Must Enter a Room!');
        return false;
    } else {
        return true;
    }
}


// User connectiong error/success functions


/**
 * Surrounds the input box with red and displays an error message.
 * @error {string} The error message that is displayed below input box.
 */
function nameError(error) {
    $('#nickname-group').removeClass('has-success');
    $('#nickname-group').addClass('has-error .has-feedback');
    $('#nickname-group').append('<label class="control-label chat-error" for="nickname-input">' + error + '</label>');
}

/**
 * Surrounds the input box with green to indicate a valid input.
 */
function nameSuccess() {
    $('#nickname-group').removeClass('has-error');
    $('#nickname-group').addClass('has-success .has-feedback');
}

/**
 * Surrounds the input box with red and displays an error message.
 * @error {string} The error message that is displayed below input box.
 */
function roomError(error) {
    $('#room-group').removeClass('has-success');
    $('#room-group').addClass('has-error .has-feedback');
    $('#room-group').append('<label class="control-label chat-error" for="room-input">' + error + '</label>');
}

/**
 * Surrounds the input box with green to indicate a valid input.
 */
function roomSuccess() {
    $('#room-group').removeClass('has-error');
    $('#room-group').addClass('has-success .has-feedback');
}


// Chat window functionality functions


/** 
 * Write a notification to the chat window
 * @notification {string} Short notification message to display to the user.
 */
function addNotification(notification) {
    lastSender = '';
    $('#chat-window').append('<div class="chat-element"><h4>' + notification + '<h4></div>');
}

/**
 * Write a message to the chat window
 * @message {string} Message to display to users.
 * @nickname {string} User's nickname that sent the message to be displayed.
 */
function addMessage(msg, id, nickname) {
    if (id !== lastSenderID || lastSender === '') {
        lastSender = nickname;
        lastSenderID = id;
        $('#chat-window').append('<div class="chat-element"><h5>' + nickname + '</h5><p>' + msg + '</p></div>');
    } else {
        $('#chat-window').find('.chat-element:last').append('<p>' + msg + '</p>');
    }
    $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
}

/**
 * Adds a user to the list of users on the sidebar.
 * @nickname {string} The nickname of the user to add.
 */
function addUser(id, nickname) {
    $('#user-list').append('<li id="' + id + '-li" class="user-li"><a href="#">' + nickname + '</a></li>');
}

/**
 * Removes a user from the list of users on the sidebar.
 * @nickname {string} The nickname of the user to remove.
 */
function removeUser(id, nickname) {
    $('#' + id + '-li').remove();
}

/**
 * Clears the entire sidebar list of users.
 */
function clearUsers() {
    $('.user-li').remove();
}


// Client to Server communication functions


/**
 * Protocol definition...
 * The function/message prefix describes the use and return type for each function.
 * These prefixes are:
 *      send - Transmit data to server and expect no response.
 *      check - Transmit data to server and expect a boolean response in data.valid.
 *      get - Ping the server for data and expect the response in data.response.
 *      set - Transmit data to the server, to modify the user, and expect a response in data.success.
 * All response data is processed by a given callback function.
 */

/**
 * Sends a message string to the server, which will be broadcast to the user's room.
 * @message {string} The message to be sent to the server
 */
function sendMessage(message) {
    socket.emit('sendMessage', message);
}

/**
 * Tells the server to delete the unused room that it created for the user.
 * @room {string} Name of the room that was unused and will be deleted.
 */
function sendDeleteRoom(room) {
    socket.emit('sendDeleteRoom', room);
}

/**
 * Sends a room name that will be checked for existence by the server.
 * If the name exists, the user will attempt to join the room.
 * If the name does not exist, an error will be thrown.
 * @room {string} The name of the room to be checked by the server.
 * @fn {function} Callback function to pass to server to handle response.
 */
function checkRoom(room, fn) {
    socket.emit('checkRoom', room, fn);
}

/**
 * Asks the server to send an array of the users in a room.
 * @room {string} Name of the room to check.
 * @fn {function} Callback function to pass to server to handle response.
 */
function getUsers(room, fn) {
    socket.emit('getUsers', room, fn);
}

/** 
 * Asks the server to generate a new room for the user to create.
 * @fn Callback function to pass to server to handle response.
 */
function getRoom(fn) {
    socket.emit('getRoom', fn);
}

/**
 * Asks the server to move the user to the user's room (gRoom).
 * @room {string} Name of the room that the user will be moved to.
 * @fn {function} Callback function to pass to the server to handle response.
 */
function setRoom(room, fn) {
    gRoom = room;
    socket.emit('setRoom', gRoom, fn);
}

/**
 * Asks the server to set the user's nickname (gNickname).
 * @nickname {string} The nickname of the user to be set.
 * @fn {function} Callback function to pass to server to handle response.
 */
function setNickname(nickname, fn) {
    gNickname = nickname;
    socket.emit('setNickname', gNickname, fn);
}


// WebRTC


// Set port and turn off video
easyrtc.setSocketUrl(":8080");
easyrtc.dontAddCloseButtons(true);
easyrtc.enableVideo(false);
easyrtc.enableVideoReceive(false);

// Construct new element when a new stream arrives
easyrtc.setStreamAcceptor(function (id, stream) {
    $('#media-elements').append('<video id="peer-' + id + '" class="peer-media"></video>');
    easyrtc.setVideoObjectSrc($('#peer-' + id)[0], stream);
});

// Destroy that element when a stream closes
easyrtc.setOnStreamClosed(function (id) {
    $('#peer-' + id).remove();
});

/**
 * Function that calls all current members in a room when the user connects.
 * @room {object} Room that the user and other users belong to.
 * @peers {array} Array of users in the room.
 */
function rtcListener(room, peers) {
    easyrtc.setRoomOccupantListener(null); // Only call the memebers when user joins
    var callback = function () {};
    for(var id in peers) {
        easyrtc.call(id, callback, callback, callback);
    }
}

/**
 * Function sets up the user's rtc object and connect.
 */
function initializeRTC() {
    easyrtc.setRoomOccupantListener(rtcListener);
    var callback = function () {};
    $('#microphone-modal').modal({
        'show': true,
        'keyboard': false,
        'backdrop': 'static'
    });
    easyrtc.initMediaSource(function() {
        easyrtc.connect("chat", function () {
                $('#microphone-modal').hide();
            }, function () {
                $('#microphone-modal').hide();
                addNotification('You will be unable to use audio chat.');
            });
        }, function () {
            $('#microphone-modal').hide();
            easyrtc.enableAudio(false);
            easyrtc.connect("chat", function () {
                    addNotification('You will be unable to send audio.');
                }, function () {
                    addNotification('You will be unable to use audio chat.');
            });
        }
    );
    easyrtc.joinRoom(gRoom, null, callback, callback);
}


// User interaction handling


/**
 * Processs the information submitted by the user during initial connection.
 * @nickname {string} The user's desired nickname.
 * @room {string} The user's desired room destination.
 */
function processUserConnection(nickname, room) {
    setNickname(nickname, function (data) {
        if (data.success) {
            gID = data.userID;
            setRoom(room, function (data) {
                if (data.success) {
                    $('#chat-bar').show();
                    $('#room-name-header').append('<p>' + gRoom + '</p>');
                    $('#nickname-display').append(gNickname);
                    $('#reg-modal').modal('hide');
                    getUsers(gRoom, function (data) {
                        $.each(data.response, function (i, value) {
                            addUser(value[0], value[1]);
                        });
                    });
                    if (navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia) {
                        initializeRTC();
                    } else {
                        addNotification('Your browser does not support WebRTC, you will not be able to use audio chat.');
                    }
                }
            });
        }
    });
}

/**
 * Attempt to validation information prior to connection.
 */
 function validateUserConnection() {
    clearErrors();
    var nameValidation = validateName();
    if ($('#join-tab').hasClass('active')) {
        // Begin room validation if join-tab is open.
        if (validateRoom()) {
            checkRoom($('#room-input').val(), function (data) {
                // data.valid will be true if the room exists on the server.
                if (data.valid) {
                    if (nameValidation) {
                        roomSuccess();
                        sendDeleteRoom(tRoom);
                        processUserConnection($('#nickname-input').val(), $('#room-input').val());
                    }
                } else {
                    roomError('That room doesn\'t exist!');
                }
            });
        }
    } else {
        // Attempt to create and join new room if create-tab is open.
        if (nameValidation) {
            processUserConnection($('#nickname-input').val(), tRoom);
        }
    }
 }


// Default function and page functionality functions 


/**
 * Validates the message input and, if valid, adds message to chat window and sends to server.
 */
 function validateMessage() {
    // If user was typing message, send the message.
    if ($('#message-input').val() !== "") {
        sendMessage($('#message-input').val());
        addMessage($('#message-input').val(), gID, gNickname);
        $('#message-input').val('');
    }
 }

/**
 * Default function which runs when page is ready.
 */
$(function() {
    $('#chat-window').css('height', '-=110px');
    $('#chat-bar').hide();
    $('#reg-modal').modal({
        'show': true,
        'keyboard': false,
        'backdrop': 'static'
    });
    $('#create-tab-header a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
    $('#join-tab-header a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
    $('#connect-user-button').click(function (e) {
        validateUserConnection();
    });
    $('#message-button').click(function (e) {
        validateMessage();
    });
    getRoom(function (data) {
        tRoom = data.response; // Stores this room name in case the user decides to create a room.
        $('#create-input').val(data.response);
    });
});


/**
 * Handles all user keypresses
 */
$(document).keypress(function (event) {
    // Handles the ENTER key being pressed.
    if (event.which === 13) {
        event.preventDefault();
        if ($('#message-input').is(':focus')) { 
            validateMessage();
        } else if ($('#message-input').is(':visible')) {
            // If user has connected, focus the message input field.
            $('#message-input').focus();
        }
        else if ($('#nickname-input').is(':focus') || $('#room-input').is(':focus')) {
            // If the user has finished typing in a connection field, attempt to validate connection.
            validateUserConnection();
        }
    }
});


// Server to client communication messages.

/**
 * Message expectations are defined by their prefixes.
 * These prefixes are:
 *      universal - Transmit data to all clients, expect no response.
 *      broadcast - Transmit data to all clients in a given room, expect no response.
 */

/**
 * Handles a message inside the user's room.
 */
socket.on('broadcastMessage', function (data) {
    addMessage(data['message'], data['id'], data['nickname']);
});

/**
 * Handles a server notification inside the uers's room.
 */
socket.on('broadcastNotification', function (data) {
    addNotification(data['notification']);
});

/**
 * Handles a server notification of a user joining the room.
 */
socket.on('broadcastUserJoined', function (data) {
    addNotification(data['nickname'] + ' has joined the room.');
    addUser(data['id'], data['nickname']);
});

/**
 * Handles a server notification of a user disconnecting.
 */
socket.on('broadcastUserDisconnected', function (data) {
    addNotification(data['nickname'] + ' has disconnected.');
    removeUser(data['id'], data['nickname']);
});

/** 
 * Handles a server notification of a user leaving the room.
 */
socket.on('broadcastUserLeft', function (data) {
    addNotification(data['nickname'] + ' has left the room.');
    removeUser(data['id'], data['nickname']);
});

/**
 * Handles resizing of the chat window.
 */
$(window).resize(function() {
    var height = $(document).height();
    $('#chat-window').height(height);
    $('#chat-window').css('height', '-=130px');
});