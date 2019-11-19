module.exports = {
    genTokens : function () {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var token='';
        for (let i = 16;  i > 0; --i) {
            token += chars[Math.round(Math.random() * (chars.length - 1) )]
            
        }
        return(token);
    }
}