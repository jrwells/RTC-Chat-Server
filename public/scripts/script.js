// Initiate socket connection and define important variables
var socket = io.connect(),
    gNickname = '', // Global user's current nickname.
    gRoom = ''; // Global user's current room.


// Variables used for temporary storage.
var tRoom = ''; // Stores the room that the server generates for the user.


// User connection UI functions


function nameError(error) {

}

function nameSuccess() {

}

function roomError(error) {

}

function roomSuccess() {

}

// Universal UI functions


/**
 * Clears all errors.
 */
function clearErrors() {
    $('.error').remove();
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
    $('.warning').remove();
}

/**
 * Throw a warning in a given element.
 * @element {DOM element} The element on which to append the warning.
 * @warning {string} A short message about the type of warning.
 */
function throwWarning(element, warning) {
    element.append('<div class="chat-warning">' + warning + '</div>');
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
 * Processse the information submitted by the user during initial registration.
 * @nickname {string} The user's desired nickname.
 * @room {string} The user's desired room destination.
 */
function processUserRegistration(nickname, room) {
    setNickname(nickname, function (data) {
        if (data.success) {
            setRoom(room, function (data) {
                if (data.success) {
                    $('#chat-controls').show();
                    $('#reg-modal').dialog('close');
                }
            });
        }
    });
}

/**
 * Handles user information entering.
 * Makes sure that all fields have potentially valid information before processing.
 */
function handleUserRegistration() {
    clearErrors();
    var nickname = $('#nickname-input').val();
    // Make sure a nickname has been entered.
    if (nickname !== "") {
        // Make sure user has chosen valid room option (create or join).
        if ($("#roomAccordion").accordion("option", "active") !== false) {
            // If option is 0, user is creating a new room.
            if ($('#roomAccordion').accordion('option', 'active') === 0) {
                processUserRegistration(nickname, tRoom);
            } else {
                // Else, if option is 1, user is joining a room.
                var room = $('#room-input').val();
                // Make sure a room name has been entered.
                if (room !== "") {
                    checkRoom(room, function (data) {
                        // data.valid will be true if the room exists on the server.
                        if (data.valid) {
                            processUserRegistration(nickname, room);
                        } else {
                            // The room does not exist.
                            throwError($('#reg-modal'), 'Invalid room name!');
                        }
                    });
                } else {
                    // Room name is blank.
                    throwError($('#reg-modal'), 'Enter a room name!');
                }
            }
        } else {
            // User has not touched a room option.
            throwError($('#reg-modal'), 'Choose an option!');
        }
    } else {
        // Nickname is blank.
        throwError($('#reg-modal'), 'Enter a nickname!');
    }
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
        e.preventDefault()
        $(this).tab('show')
    });
    $('#join-tab-header a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    });
    $('#submit-user-button').click(function (e) {
        
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
            handleUserRegistration();
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