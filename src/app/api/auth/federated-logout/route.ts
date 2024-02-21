import { JWT, getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

function logoutParams(token: JWT): Record<string, string> {
    return {
        id_token_hint: token.idToken as string, //! oturumu sonlandırmak için kullanılacak JWT tokenı
        post_logout_redirect_uri: process.env.NEXTAUTH_URL as string, //! oturum sonlanınca yönlendirileceği URL
    };
}

function handleEmptyToken() { //! token yoksa hata message dondurur
    const response = { error: "No session present" };
    const responseHeaders = { status: 400 };
    return NextResponse.json(response, responseHeaders);
}

function sendEndSessionEndpointToURL(token: JWT) { //! oturumu sonlandırmak için gerekli olan URL'yi oluşturur
    const endSessionEndPoint = new URL( //!  Bu URL, oturumu sonlandırmak için keycloak provider a yönlendirme yapar.
        `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
    );
    const params: Record<string, string> = logoutParams(token);
    const endSessionParams = new URLSearchParams(params);
    const response = { url: `${endSessionEndPoint.href}/?${endSessionParams}` };
    return NextResponse.json(response);
}

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req }) //! req den gelen token ı alınır
        if (token) {
            return sendEndSessionEndpointToURL(token); //! token varsa oturumu sonlandırmak icin URL olusturulur ve istemciye dondurulur
        }
        return handleEmptyToken(); //! token yoksa hata mesajı dondurur
    } catch (error) { //! token alırken hata olusursa error ve 500 dondurulur
        console.error(error);
        const response = {
            error: "Unable to logout from the session",
        };
        const responseHeaders = {
            status: 500,
        };
        return NextResponse.json(response, responseHeaders);
    }
}