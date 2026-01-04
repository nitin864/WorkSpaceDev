

//get all WorkSpaces for user

import prisma from "../configs/prisma.js";

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
     }});

     if(!workspace){
        return res.status(404).json({message: "Workspace not found"})
     }

     ///check creator has admin role
     if(!workspace.members.find((member)=>member.userId === userId && member.role === "ADMIN")){
        return req.status(401).json({message: "You don't have ADMIN privilages"})
     }

     //check if user is already a member 
     const existingMember = workspace.members.find((member)=> member.userId === userId);

     if(existingMember){
        return req.status(401).json({message: "User is already a memeber"})
     }

     const  member =  await prisma.workspaceMember.create({
        data: {
            userId: user.id,
            workspaceId,
            role,
            message
        }
     })

     req.json({member  ,message: "Member added successfully"})
     
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}