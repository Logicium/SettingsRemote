var fs = require('fs');
var path = require('path');
var LinvoDB = require("linvodb3");
LinvoDB.dbPath = process.cwd();
var Databases = {};
var UsersDB = new LinvoDB('users',{});
var SettingsDB = new LinvoDB('settings',{});

Databases = {
    Users: UsersDB,
    Settings: SettingsDB
};

//Initialize first user for Users Database:

var adminUser = {
    username:'admin',
    password:'superSecret'
};

//Initialize Settings Database with the following code:

Databases.Users.insert(adminUser, function (err, newDoc) {
    console.log(newDoc);
    console.log('Admin user added.');
    var Config = fs.readFile(path.join(__dirname, './../public/libraries/Config.json'),'utf8',function (err,data) {
        if (err) throw err;
        data = JSON.parse(data);
        console.log(data);
        for(var i=0;i<data.length;i++){
            data[i].user = newDoc._id;
            Databases.Settings.insert(data[i], function (err, newDoc) {
                console.log(newDoc);
                console.log('Settings file initialized');
            });
        }
    });
});

module.exports = Databases;