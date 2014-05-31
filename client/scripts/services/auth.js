var controllersModule = angular.module('controllersModule');

controllersModule.factory('Auth', function() {
    var user;

    return{
        setUser: function (aUser) {
            console.log('set user to:' + aUser.username);
            user = aUser;
        },
        isLoggedIn: function () {
            return(user) ? user : false;
        }
    }
});