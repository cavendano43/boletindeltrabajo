const express = require('express')
const router = express.Router()
const bodyParse = require('body-parser')
var path = require('path');
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
////////////////////////// models ////////////////////////////
const User= require ('../models/User');
const Contacto =require('../models/Contacto')
const Cursos=require('../models/Cursos');
const Noticias=require('../models/Noticias');
const Usuario=require('../models/Usuario');
const Comentario=require('../models/Comentario');
const UsuarioNewsletter=require('../models/UsuarioNewsletter');
const Cv=require('../models/Cv');
const Rating=require('../models/Rating');
const Eventos = require('../models/Eventos');
///////////////////////////// middleware ///////////////////////////
const utf8=require('utf8');
const bcrypt = require ('bcrypt') ;   
const { verify } = require('crypto')
var multer  = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/storage/cv/')
    },
    filename: function (req, file, cb) {
      cb(null,`${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    }
 })
   
var upload = multer({ storage: storage })


const transporter = nodemailer.createTransport({
    host: "mail.grupoboletindeltrabajo.cl",
    port: 26,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'contacto@grupoboletindeltrabajo.cl', // generated ethereal user
      pass: 'grupoboletindeltrabajo', // generated ethereal password
    },tls:{
        rejectUnauthorized: false
      }
  });

router.get("/",(peticion,respuesta)=>{
    respuesta.send('link https://grupoboletindeltrabajo-b871d.web.app/');
})

router.get("/search",(req,res)=>{

})
router.get("/eventos",async(req,res)=>{
    const event=await Eventos.find();
    
  
    let consulta;

    eventos= [];   

    for(i=0;i<event.length;i++){
        consulta= await Cursos.findById(event[i].id,{area:1,portada:1,_id:1});
        console.log(consulta)
        eventos.push({
            id:event[i].id,
            titulo:event[i].title,
            modalidad:event[i].modalidad,
            start:event[i].start,
            end:event[i].end,
            portada:consulta.portada,
            area:consulta.area,
        })
    }

    res.json(eventos);
})
router.post("/usuariosnewsletter",async(req,res)=>{
    const email=req.body.subscribeSr;
    console.log(email);
    const comprobante=await UsuarioNewsletter.find({email:email});
    if(comprobante.length > 0){
    
        resps={
            "estatus":0,
        }
    }else{
        const usuarionewsletter={
            email:email
        }
        let usuarionewsletterModel = new UsuarioNewsletter(usuarionewsletter);
        const respu=usuarionewsletterModel.save();
        resps={
            "estatus":1,
           
        }
    }
   
    res.json(resps)
})
router.post('/rating',async(req,res)=>{
    const id=req.body.id;
    const rating={
        id:id,
        tipo:req.body.tipo,
        nombre:req.body.nombre,
        email:req.body.email,
        titulo:req.body.titulo,
        comentario:req.body.comentario,
        recomendacion:req.body.recomendacion,
        rating:req.body.rating
    }
    let ratingModel = new Rating(rating);
    ratingModel.save();

    const promediototal=await Rating.aggregate([{$match:{id:id}},
        {$group:
            {
                _id:"$id",
                total:{$sum:1},
                promedio:{$avg:"$rating"}
              
            },
             
        },
    
    ]);
    if(promediototal){
        const promedio=promediototal[0].promedio.toFixed(1);
        const puntuaciontotal=promediototal[0].total;
        const rest=await Cursos.findByIdAndUpdate(id,{puntuacion:promedio,puntuaciontotal:puntuaciontotal});
    }
    
    const resp=await Rating.find({id:req.body.id});
  
    return res.json({resp})
})
router.get('/rating/:id',async(req,res)=>{
    const id=req.params.id;
    const rating=await Rating.find({id:id});
    

    const rs=await Rating.aggregate([{$match:{id:id}},
        {$group:
            {
                _id:"$rating",
                cantidad:{$sum:1},
                totales:{$sum:"$rating"},
                
            },
        },
      
     
    ])
 
    
    const promediototal=await Rating.aggregate([{$match:{id:id}},
        {$group:
            {
                _id:"$id",
                total:{$sum:1},
                promedio:{$avg:"$rating"}
              
            },
        },
    
    ]);
  

    var total=promediototal[0].total;
    var start5={
        start:5,
        cantidad:0,
        promedio:0,
    },
    start4={
        start:4,
        cantidad:0,
        promedio:0,
    },
    start3={
        start:3,
        cantidad:0,
        promedio:0,
    },
    start2={
        start:2,
        cantidad:0,
        promedio:0,
    },
    start1={
        start:1,
        cantidad:0,
        promedio:0,
    };

    rs.forEach(element=>{

        if(element._id==5){
            start5={
                start:element._id,
                cantidad:element.cantidad,
                promedio:(element.cantidad/total*100).toFixed(2),
            }
        }

        if(element._id==4){
            start4={
                start:element._id,
                cantidad:element.cantidad,
                promedio:(element.cantidad/total*100).toFixed(2),
            }
        }

        if(element._id==3){
            start3={
                start:element._id,
                cantidad:element.cantidad,
                promedio:(element.cantidad/total*100).toFixed(2),
            }
        }

        if(element._id==2){
            start2={
                start:element._id,
                cantidad:element.cantidad,
                promedio:(element.cantidad/total*100).toFixed(2),
            }
        }

        if(element._id==1){
            start1={
                start:element._id,
                cantidad:element.cantidad,
                promedio:(element.cantidad/total*100).toFixed(2),
            }
        }
    })
    cantidadstart=[start5,start4,start3,start2,start1];
    const ratings={
        comentario:rating,
        promedio:promediototal[0].promedio.toFixed(1),
        total:promediototal[0].total,
        cantidadstart:cantidadstart
    };

  
    if(rating){
        res.json(ratings);
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }
})




router.post('/cv',upload.single('cv'),(req,res)=>{


    const cv={
        nombre:req.body.nombre,
        email:req.body.email,
        telefono:req.body.telefono,
        areas:req.body.areas,
        mensaje:req.body.mensaje,
    }

    let cvModel = new Cv(cv);

    if(req.file){
        const ref=req.file;
        const filename=ref.filename;
        cvModel.setCv(filename);
    }

    cvModel.save();

    const resp={
        "respuesta":1,
        "progress":100,
    }

    return res.status(201).json({resp})
});


router.post("/contacto",async(req,res)=>{
 
    let contacto={};
    if(req.body.apellidos){

        contacto.tipo="cursos";
        contacto.nombre=req.body.nombre;
        contacto.apellido=req.body.apellidos;
        contacto.email=req.body.correo;
        contacto.asunto="Interes diplomado"
        contacto.razonsocial=req.body.razonsocial;
        contacto.direccion=req.body.direccion;
        contacto.rut=req.body.rut;
        contacto.telefono=req.body.telefono;     
        contacto.mensaje=req.body.mensaje;
        contacto.leido=false;
        contacto.destacado=false;
 

    }else{
        const {nombre,email,asunto,telefono,mensaje} = req.body;
        contacto.tipo="contacto";
        contacto.nombre=nombre;
        contacto.email=email;
        contacto.asunto=asunto;
        contacto.telefono=telefono;
        contacto.mensaje=mensaje;
        contacto.leido=false;
        contacto.destacado=false;

    }
    
    
    
    let contactoModel = new Contacto(contacto);
    await contactoModel.save();
    //enviarCorreoBienvenida(email,nombre,asunto,telefono,mensaje);
    return res.json({"res":1});

})

router.get('/noticias/:area/',async(req,res)=>{
    const busqueda = ( req.query.busqueda ) ? req.query.busqueda : ""
    const area=req.params.area;
    let noticias;
    if(area=="all"){
        noticias= await Noticias.find({},{_id:1,titulo:1,categoria:1,resumen:1,portada:1,autor:1});
    }else{
        noticias= await Noticias.find({categoria:area},{_id:1,titulo:1,categoria:1,resumen:1,portada:1,autor:1});
    }

    if(noticias){
        return res.json({noticias})
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }

})

router.get('/ultimas/noticias',async(req,res)=>{
    const sidebar=[];
    const noticias= await Noticias.find().sort({fechaEdicion:-1}).limit(3);


    if(noticias){
        return res.json({noticias})
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }

})

router.get('/noticias/:area/:id',async(req,res)=>{
    const id=req.params.id;
    const area=req.params.area;

    const noticias = await Noticias.findById(id);

    sumarvisita(id);
    
    if(noticias){
        return res.json(noticias)
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }

})


router.get('/comentarios/:id',async(req,res)=>{
   
    const id=req.params.id;

    const comentario= await Comentario.find({id:id});
   
    if(comentario){
        return res.json(comentario)
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }
});


router.post('/comentario/registrar',async(req,res)=>{
    let avat;
 
    let usuario= await Usuario.findOne({email:{$elemMatch:{email:req.body.email}}},{avatar:1,_id:1});
  
    if(usuario){
        avat=`https://portaldesoluciones.cl/${usuario.avatar}`
    }else{
        avat='assets/images/avatar/user_icon.png';
    }
 
    let comment={

        "id":req.body.id,
        "nombre":req.body.nombre,
        "email":req.body.email,
        "avatar":avat,
        "comentario":req.body.comentario,
        "tipo":req.body.tipo,
        "reply":req.body.reply,
        "fecha":req.body.fecha,

    }
    
    let comentarioModel=new Comentario(comment);
    const resp=await comentarioModel.save(); 
    
    
    return res.status(201).json(resp);
})


router.get('/cursos',async(req,res)=>{
    
    const cursos=await Cursos.aggregate([
        {
           $project: {
            _id:1,areaempresa:1,area:1,codigosence:1,duracion:1,tipo:1,tituloLargo:1,descripcion:1,horas:1,portada:1,modalidad:1,puntuacion:1,visita:1,  
              modulos: { $cond: { if: { $isArray: "$modulos" }, then: { $size: "$modulos" }, else: "NA"} }
           }
        }
     ] );

    if(cursos){
        return res.json(cursos)
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }

})


router.get('/cursos/row',async(req,res)=>{
    let alldiplomados,dilaboral,ditributario,dieducacional,dirrhh,disalud,dimarketing;
    let allseminarios,semilaboral,semitributario,semieducacional,semirrhh;
    rows=[]
    result=[]
    const rowscursos=await Cursos.aggregate([
    {
        $group:{
            _id:{
                area:"$area",
                tipo:"$tipo"
            },
            rows:{
                $sum: 1
            }
        },
    
    }])

    rowscursos.forEach(element=>{

       
        if(element._id.area=="Laboral" && element._id.tipo=="Diplomado"){
            dilaboral=element.rows;
        }
        if(element._id.area=="Tributario" && element._id.tipo=="Diplomado"){
            ditributario=element.rows;
        }
        if(element._id.area=="Educacional" && element._id.tipo=="Diplomado"){
            dieducacional=element.rows;
        }
        if(element._id.area=="RRHH" && element._id.tipo=="Diplomado"){
            dirrhh=element.rows;
        }
        if(element._id.area=="Salud" && element._id.tipo=="Diplomado"){
            disalud=element.rows;
        }
        if(element._id.area=="Marketing" && element._id.tipo=="Diplomado"){
            dimarketing=element.rows;
        }
        if(element._id.area=="Laboral" && element._id.tipo=="Seminario"){
            semilaboral=element.rows;
        }
        if(element._id.area=="Tributario" && element._id.tipo=="Seminario"){
            semitributario=element.rows;
        }
        if(element._id.area=="Educacional" && element._id.tipo=="Seminario"){
            semieducacional=element.rows;
        }
        if(element._id.area=="RRHH" && element._id.tipo=="Seminario"){
            semirrhh=element.rows;
        }

    })


    result.push({
        rowalldiplomados:alldiplomados,
        rowsdiplomadoslaboral:dilaboral,
        rowsdiplomadotributario:ditributario,
        rowsdiplomadoeducacional:dieducacional,
        rowsdiplomadorrhh:dirrhh,
        rowsdiplomadosalud:disalud,
        rowsdiplomadomarketing:dimarketing,
        rowallseminario:allseminarios,
        rowsseminariolaboral:semilaboral,
        rowsseminariotributario:semitributario,
        rowsseminarioeducacional:semieducacional,
        rowsseminariorrhh:semirrhh,
    })

    res.json(result);
});

router.get('/cursos/:id',async(req,res)=>{
    const id=req.params.id;
    const cursos= await Cursos.findById(id);

  
    const curso=[];

    if(cursos){
        const tipo=cursos.tipo;
        const area=cursos.area;
        const resp=await Cursos.findByIdAndUpdate(id,{ $inc: {visita:1}});
        const cursosrel=await Cursos.find({tipo:tipo,area:area},{_id:1,tituloCorto:1,portada:1,area:1});
        const curso={
            cursos:cursos,
            cursosrelacionados:cursosrel
        };
 
        return res.json(curso)
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }
})

router.get('/cursos/mostrar',async(req,res)=>{
    const cursos= await Cursos.find();

    if(cursos){
        return res.json(cursos)
    }else{
        return res.status(404).send({errors:["No se encuentra esa Publicacíon"]})
    }
})



function promesa(cambio){
    
    const promesa=new Promise((resolve,reject)=>{
        if(cambio!=""){
            resolve(utf8.decode(cambio))
        }else{
            reject('');
        }
    })

    return promesa;

}





async function enviarCorreoBienvenida(email,nombre,asunto,telefono,mensaje){
  
    const opciones = {
      from:'contacto@grupoboletindeltrabajo.cl',
      to:email,
      subject: asunto,
      text:`
      Nombre: ${nombre}
      Email: ${email}
      Asunto: ${asunto} 
      Telefono: ${telefono}
      mensaje:
       ${mensaje}
      `
    }
  
    await transporter.sendMail(opciones,(error,info)=>{

        if(info){
            console.log(info)
            return 1;
            
          }else{
            console.log(error)
            return 0;
            
        }
    })
  
  }

function verifytToken(req,res,next){
    if(!req.headers.authorization){
        return res.status(401).send('Uthorize Request');
    }
    
    const token = req.headers.authorization.split(' ')[1];
    if(toke === 'null'){
        return res.status(401).send('Unathorize Request');
    }

    const payload= jwt.verify(token,'secretKey');
    req.userId = payload._id;
    next();

    console.log(payload);
}

async function encritarpassword(password){

    const saltRounds = 10;

    const hashPassword= await bcrypt.hash(password,saltRounds);



    return hashPassword;

}
async function sumarvisita(id){
   const res=await Noticias.findByIdAndUpdate(id,{ $inc: {visitas:1}});
   return res;
}

module.exports = router