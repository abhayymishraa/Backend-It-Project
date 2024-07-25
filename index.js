const express = require('express');

let data = [];


const app = express();
app.use(express.json()); 


app.get('/', (req, res) => {
  console.log(data);
   res.send('Data:<br>' + data.join('<br>'));
});


app.post('/', (req, res) => {
        console.log(req.body);
        const d = new Date();        
        data.push('Data Received - ' + d + "  " + JSON.stringify(req.body));
	res.json(req.body);
});

app.get('/delete/all', (req,res) =>{
        data = [];
	res.send("<div>  message : Deleted Data </div>");

})



app.listen(3000, () => console.log('Example app is listening on port 3000.'));
