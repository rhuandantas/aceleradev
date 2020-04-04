const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const request = require('request');

const answerJson = path.resolve(__dirname, 'files', 'answer.json');
const token = process.env.TOKEN;

const saveJson = (data) => fs.writeFileSync(answerJson, JSON.stringify(data));
const readJson = () => fs.readFileSync(answerJson, 'utf-8');

const decodeJulioCesar = (cifrado, casas) => {
    const texto = cifrado.toLowerCase();
    let decoded = "";
    const num = casas < 0 ? 26 : casas;
    for (let i = 0; i < texto.length; i++) {
        const charCode = texto.charCodeAt(i);
        let char = "";
        if (charCode >= 97 && charCode <= 122) {
            if (charCode - num < 97) {
                char = String.fromCharCode(charCode - num + 122 - 97 + 1)
            } else {
                char = String.fromCharCode(charCode - num)
            }
        }
        else {
            char = String.fromCharCode(texto.charCodeAt(i));
        }
        decoded += char;
    }
    return decoded;
}

const decodeTexto = () => {
    try {
        const json = JSON.parse(readJson());
        json.decifrado = decodeJulioCesar(json.cifrado, json.numero_casas);
        saveJson(json);
    } catch (error) {
        console.log(error.message)
    }
}

const criptoSha1 = txt => crypto.createHash('sha1').update(txt).digest('hex');

const encryptResumo = () => {
    try {
        const dataJson = JSON.parse(readJson());
        dataJson.resumo_criptografico = criptoSha1(dataJson.decifrado)
        saveJson(dataJson);
    } catch (error) {
        console.log(error.message);
    }
}

const getAnswer = async () => {
    try {
        const url = process.env.URL_CHALLENGE;
        const res = await axios.get(url, {
            params: { token }
        });
        saveJson(res.data);
    } catch (error) {
        console.log(error.message)
    }
}

const submit = async () => {
    try {
        const url = process.env.URL_SUBMIT;
        const headers = {
            'Content-Type': 'multipart/form-data'
        };
        const req = request.post(
            { url: `${url}?token=${token}`, headers },
            function optionalCallback(err, httpResponse, body) {
                if (err) return console.error('upload failed:', err);
                console.log(body);
            });
        const form = req.form();
        form.append('answer', fs.createReadStream(answerJson), {
            filename: 'answer.json'
        });
    } catch (error) {
        console.log(error);
    }
}

const init = async () => {
    await getAnswer();
    decodeTexto();
    encryptResumo();
    await submit();
}

init();