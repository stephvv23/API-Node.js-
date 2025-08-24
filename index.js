import express from 'express';
import fs from "fs";
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json())

const readData = () => {
    try{
    const data = fs.readFileSync('./db.json');
    return JSON.parse(data);
    } catch (error) {
        console.error("Error reading the file:", error);
    }
}

const writeData = (data) => {
    try{
        fs.writeFileSync('./db.json', JSON.stringify(data));
    } catch (error) {
        console.error("Error reading the file:", error);
    }
}

app.get('/', (req, res) => {
    res.send('Welcome to my firts API with Node.js!!!!');
});


app.get('/users', (req, res) => {
    const data = readData();
    res.json(data.users); //solo envia los users
});

app.get('/users/:id', (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const user = data.users.find(user => user.id === id);

    res.json(user); //solo envia el user con el id especifico
});

app.post('/users', (req, res) => {
    const data = readData();
    const body = req.body;
    const newUser = { 
        id: data.users.length + 1,
        ...body,
    };
    data.users.push(newUser);
    writeData(data);
    res.json(newUser);
});

app.put('/users/:id', (req, res) => {
    const data = readData();
    const body = req.body;
    const id = parseInt(req.params.id);
    const userindex = data.users.findIndex((user) => user.id === id);
    
    data.users[userindex] = { 
        ...data.users[userindex],
        ...body }; //actualiza el user con la info del body
    writeData(data);
    res.json({message: 'User updated successfully'});
});

app.delete('/users/:id', (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const userindex = data.users.findIndex((user) => user.id === id);
    
    data.users.splice(userindex, 1); //elimina el user con el id especifico
    writeData(data);
    res.json({message: 'User deleted successfully'});
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});