var express = require('express');
var router = express.Router();
var multer  =   require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');

var Databases = require('./Databases');

router.post('/generateToken',function(request,response){
    //
    Databases.Users.findOne({username:request.body.username,password:request.body.password},function(err,doc){
        if(err){return console.log(err)}
        var apiToken = jwt.sign({U:request.body.username}, 'superSecret');
        doc.apiToken = apiToken;
        doc.save();
        response.send({message:'Send this token to authenticate requests for your app',token:apiToken})
    });
});

router.post('/newUser',function(request,response){
    Databases.Users.insert(request.body.user,function(err,doc){
        if(err){return console.log(err)}
        var apiToken = jwt.sign({U:request.body.user.username}, 'superSecret');
        doc.apiToken = apiToken;
        doc.save();
        response.send({message:'Send this token to authenticate requests for your app',token:apiToken})
    });
});

router.get('/remote/list',function(request,response){
    //List all from Database
    Databases.Users.findOne({apiToken:request.body.apiToken},function(err,doc){
        if(err){return console.log(err)}

        console.log("Download all Settings request.");
        Databases.Settings.find({user:doc.username}, function (err, settings) {
            if(err){return console.log(err)}
            response.send(settings);
        });
    });
});

router.post('/remote/initializeDB',function(request,response) {
    Databases.Users.findOne({apiToken:request.body.apiToken},function(err,doc){
        if(err){return console.log(err)}

        console.log("Initialize user settings request");
        Databases.Settings.remove({user:doc._id}, function (err, numRemoved) {
            if(err){return console.log(err)}

            var settings = request.body.settings;
            for(var i in settings){
                settings[i].user = doc._id;
                Databases.Settings.insert(settings[i],function(err,doc){});
            }

            response.send({message:'Settings database initialized'});
        });
    });
});

router.post('/remote/update',function(request,response){

    Databases.Users.findOne({apiToken:request.body.apiToken},function(err,doc){
        if(err){return console.log(err)}

        var parentName = request.body.parentTitle;
        var parentIndex = request.body.parentIndex;
        var newConfig = JSON.parse(request.body.newConfig);
        console.log(newConfig);

        Databases.Settings.findOne({name:parentName,user:doc._id},function (err, doc) {
            console.log(JSON.stringify(doc));
            doc.data = newConfig[parentIndex].data;
            console.log('Logging doc');
            doc.save(function (err) {});
            response.send({message:'Successfully Updated',doc:doc});
        });

    });
});

var storage	=	multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now()+'.jpg');
    }
});


router.post('/remote/uploadOne',function(req,res,next){
    var upload = multer({ storage : storage}).single('file');
    Databases.Users.findOne({apiToken:request.body.apiToken},function(err,doc){
        if(err){return console.log(err)}

        console.log('Upload file request.');
        upload(req,res,function(err) {
            console.log(req.file);
            if(err) { return res.end(JSON.stringify({message:"Error uploading file.",type:'error'})); }
            res.end(JSON.stringify({message:"File is Uploaded",filename:req.file.filename,type:'success'}));
        });
    });
});

