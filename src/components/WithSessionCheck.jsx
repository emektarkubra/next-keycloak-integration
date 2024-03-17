// withSessionCheck.js
'use client'
import { useEffect } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { useRouter } from 'next/router'

const withSessionCheck = (WrappedComponent) => {
    const WithSessionCheck = (props) => {
        const router = useRouter()

        useEffect(() => {
            const checkSession = async () => {
                const session = await getServerSession(authOptions)
                if (!session) {
                    router.push('/api/auth/signin')
                }
            }
            checkSession()
        }, [])

        return <WrappedComponent {...props} />
    }

    return WithSessionCheck
}

export default withSessionCheck
