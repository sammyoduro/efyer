module.exports = {
    checkPassword : function () {
        return('checking password');
    },
    checkemptyFields : function (input) {
// console.log(input);

        // req.checkBody(input,'all fields are required').notEmpty();
        return(input);
    }
}