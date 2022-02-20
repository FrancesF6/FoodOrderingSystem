// req.session: {loggedin, username, userID, sessionName}
const sessionName = 'FoodOrderingSysSession';


// continue to next if the user has logged in
function checkAuth(req, res, next) {
    if (!req.session.loggedin || !req.session.username || !req.session.userID
        || req.session.sessionName !== sessionName) {
        res.status(401).send("You haven't been logged in.");
        return;
    }
    next();
}


// continue to next if the user is not logged in
function checkUnAuth(req, res, next) {
    if (req.session.loggedin && req.session.username && req.session.userID
        && req.session.sessionName === sessionName) {
        res.status(400).send("You have already logged in.");
        return;
    }
    next();
}


// continue to next if the user is admin
function checkAdmin(req, res, next) {
    if (!req.session.loggedin || !req.session.username || !req.session.userID
        || req.session.sessionName !== sessionName || !req.session.admin) {
        res.status(401).send("You are unauthorized.");
        return;
    }
    next();
}



module.exports.sessionName = sessionName;
module.exports.checkAuth = checkAuth;
module.exports.checkUnAuth = checkUnAuth;
module.exports.checkAdmin = checkAdmin;