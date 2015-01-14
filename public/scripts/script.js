// Initiate socket connection and define important variables
var socket = io.connect(),
    gNickname = '', // Global user's current nickname.
    gRoom = ''; // Global user's current room.


// Variables used for temporary storage.
var tRoom = ''; // Stores the room that the server generates for the user.


// Universal UI functions


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


// User connection UI functions


function nameError(error) {
    $('#nickname-group').removeClass('has-success');
    $('#nickname-group').addClass('has-error .has-feedback');
    $('#nickname-group').append('<label class="control-label chat-error" for="nickname-input">' + error + '</label>');
}

function nameSuccess() {
    $('#nickname-group').removeClass('has-error');
    $('#nickname-group').addClass('has-success .has-feedback');
}

function roomError(error) {
    $('#room-group').removeClass('has-success');
    $('#room-group').addClass('has-error .has-feedback');
    $('#room-group').append('<label class="control-label chat-error" for="room-input">' + error + '</label>');
}

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
    $('#chatWindow').append('<div class="notification"><p>' + notification + '</p></div>');
}

/**
 * Write a message to the chat window
 * @message {string} Message to display to users.
 * @nickname {string} User's nickname that sent the message to be displayed.
 */
function addMessage(msg, nickname) {
    $('#chatWindow').append('<div class="message"><p>' + nickname + ' : ' + msg + '</p></div>');
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


// User interaction handling


/**
 * Processse the information submitted by the user during initial connection.
 * @nickname {string} The user's desired nickname.
 * @room {string} The user's desired room destination.
 */
function processUserConnection(nickname, room) {
    setNickname(nickname, function (data) {
        if (data.success) {
            setRoom(room, function (data) {
                if (data.success) {
                    $('#chat-controls').show();
                    $('#reg-modal').modal('hide');
                }
            });
        }
    });
}


// Default function and page functionality functions 


/**
 * Default function which runs when page is ready.
 */
$(function() {
    $('#chat-controls').hide();
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
    });
    getRoom(function (data) {
        tRoom = data.response; // Stores this room name incase the user decides to create a room.
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
        // If user was typing message, send the message.
        if ($('#message-input').is(':focus')) { 
            if ($('#message-input').val() !== "") {
                sendMessage($('#message-input').val());
                addMessage($('#message-input').val(), nickname);
                $('#message-input').val('');
            }
        } else if ($('#message-input').is(':visible')) {
            // If user has registered, focus the message input field.
            $('#message-input').focus();
        }
        else if ($('#nickname-input').is(':focus') || $('#room-input').is(':focus')) {
            // If the user has finished typing in a registration field, attempt to handle registration.
            //handleUserRegistration();
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
    addMessage(data['message'], data['nickname']);
});

/**
 * Handles a server notification inside the uers's room.
 */
socket.on('broadcastNotification', function (data) {
    addNotification(data['notification']);
});