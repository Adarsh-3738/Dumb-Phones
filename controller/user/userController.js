const loadLoginpage = async (req,res)=>{
    try{
        return res.render("login");
    }catch(error){
        console.log("login page not found");
        res.status(500).send("server error")
    }
}
module.exports = {
    loadLoginpage,
}