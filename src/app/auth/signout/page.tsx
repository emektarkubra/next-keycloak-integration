
import React, { useEffect } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Logout from '@/components/Logout'
import { redirect } from 'next/navigation'


const Signout = async () => {


    const session = await getServerSession(authOptions)

    if (session) {
        return (
            <div>
                <Logout />
            </div>
        )
    }
    return redirect('/api/auth/signin')

   
}

export default Signout
