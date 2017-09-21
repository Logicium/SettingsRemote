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
        doc.apiToken = doc.apiToken || apiToken;
        doc.save();
        response.send({message:'Send this token to authenticate requests for your app',token:doc.apiToken || apiToken})
    });
});

router.post('/remote/initializeDB',function(request,response) {

    var apiToken = request.body.apiToken;
    var settings = request.body.settings;
    console.log(apiToken);

    Databases.Users.findOne({apiToken:apiToken},function(err,doc){
        if(err){return console.log(err)}

        console.log("Initialize user settings request");
        Databases.Settings.count({},function(err,numReturned){
            if(numReturned==0){
                Databases.Settings.remove({user:doc._id},{ multi: true }, function (err1, numRemoved) {
                    if(err1){return console.log(err1)}
                    console.log(numRemoved);

                    for(var i =0;i<settings.length;i++){
                        settings[i].user = doc._id;
                        Databases.Settings.insert(settings[i],function(err2,doc2){
                            if(err2){return console.log(err2)}
                            console.log(doc2);
                        });
                    }
                    response.send({message:'Settings database initialized'});
                });
            }else{
                response.send({message:'Settings database already populated'});
            }
        });
    });
});

router.post('/login', function (request, response) {

    console.log("New user login request.");
    var incomingUser = request.body;
    console.log(incomingUser);

    Databases.Users.findOne({username:incomingUser.username,password:incomingUser.password},function(err,doc){
        if(err){return console.log(err)}
        console.log(doc);
        if (!(doc === null)) {
            var token = jwt.sign({U:incomingUser.username}, 'superSecret', {expiresIn: '10h'}); //expires in 24 hours
            response.send({message: 'Login Success!', success: true, token: token});
        }
        else {
            response.send({message: 'Login Fail', success: false});
        }
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

router.post('/remote/list',function(request,response){
    //List all from Database
    Databases.Users.findOne({apiToken:request.body.apiToken},function(err,doc){
        if(err){return console.log(err)}

        console.log("Download all Settings request.");
        Databases.Settings.find({user:doc._id}, function (err, settings) {
            if(err){return console.log(err)}
            response.send(settings);
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
//
// router.use(function(req, res, next) {
//     console.log(req.file);
//
//     // check header or url parameters or post parameters for token
//     var token = req.body.token || req.query.token || req.headers['x-access-token'];
//
//     // decode token
//     if (token) {
//         // verifies secret and checks exp
//         jwt.verify(token, 'superSecret', function(err, decoded) {
//             if (err) {
//                 return res.json({ success: false, message: 'Failed to authenticate token.' });
//             } else {
//                 // if everything is good, save to request for use in other routes
//                 req.decoded = decoded;
//                 next();
//             }
//         });
//
//     } else {
//         return res.status(403).send({
//             success: false,
//             message: 'No token provided.'
//         });
//     }
// });


module.exports = router;
