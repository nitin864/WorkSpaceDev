

//get all WorkSpaces for user

import prisma from "../configs/prisma";

export const getUserWorkSpace = async (req ,res) => {
    try {
        const {userId} = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where :{
                members: {some: {userId : userId}}
            },
            include: {
                members: {include: {user: true}},
                projects: {
                    include: {
                        tasks : {include: {assignee: true, comments: {include: 
                            {user: true}}}},
                            members: {include: {user: true}}
                    }
                },
                owner: true
            }
        });
        res.json({workspaces});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}

//Add member to Workspace
export const addMember = async(req ,res) =>{
    try {
     const {userId} = await req.auth();
     const {email,role,workspaceId, message} = req.body;

     //check if user exist
     const user = await prisma.user.findUnique({where: {email}});

     if(!user){
        return res.status(404).json({message: "User not found"})
     }
     
     if(!workspaceId || role){
        return res.status(404).json({message: "Missing required parameters"})
     }

     if(!["ADMIN" , "MEMBER"].includes(role)){
        return res.status(404).json({message: "Invalid role"})
     }


     //fetch workspace
     const workspace = await prisma.workspace.findUnique({where: {id
        : {workspaceId} , include: {members: true}
     }})

     
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}