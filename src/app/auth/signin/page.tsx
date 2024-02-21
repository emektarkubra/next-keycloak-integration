
import React, { useEffect } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Login from '@/components/Login'
import { redirect } from 'next/navigation'

interface SigninProps {
    searchParams: {
        callbackUrl: string,
        error: string
    }
}

const Signin = async ({ searchParams: { callbackUrl, error } }: SigninProps) => {
    const session = await getServerSession(authOptions) //! server side oturum bilgilerini almak için
    if (session) {
        redirect(callbackUrl || "/")
    }
    return (
        <div>
            {/* BURADA ERRORLAR VERILEBİLİR */}
            <Login />
        </div>
    )
}

export default Signin
