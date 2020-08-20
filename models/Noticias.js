const { Schema, model } = require('mongoose');
const { stringify } = require('querystring');



const NoticiasSchema = new Schema({

    tipo:String,
    autor:String,
    titulo:String,
    categoria:String,
    portada:String,
    tags:String,
    tags1:Array,
    resumen:String,
    contenido:String,
    visitas:Number,
    estado:Boolean,
    fechaEdicion:Date,
    fechaSubida:Date

},{
    timestamps:true,
})


module.exports = model('Noticias',NoticiasSchema);