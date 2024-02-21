// auth işlemleri (oturum acma, kapama, kimlik dogrulama vb.) için özel API rotalarını içerir.

import { AuthOptions, TokenSet } from "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth/next";
import KeycloakProvider from "next-auth/providers/keycloak"

// ! token bilgilerinin yenilenmesi için istek yapılır
function requestRefreshOfAccessToken(token: JWT) {
  return fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken!,
    }),
    method: "POST",
    cache: "no-store"
  });
}

export const authOptions: AuthOptions = {
  //! providers kimlik dogrulama icin kullanılıyor (Google, Facebook, GitHub gibi çeşitli sağlayıcılarla kimlik doğrulama saglanabilir.)
  providers: [
    KeycloakProvider({ // config bilgileri verilmiş
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER
    })
  ],

  //! pages nextAuth ın oturum yönetimi icin sayfa path lerini tanımlar (signin ve signout dısında )
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    // error: '/auth/error', // error page i eklenebilir
    // callback: '/auth/callback', // callback page i eklenebilir
  },

  //! session işlevi, NextAuth tarafından kullanılan bir geri çağrıdır ve oturum nesnesini oluşturmak veya değiştirmek için kullanılır.
  session: {
    strategy: "jwt", // Web Token (JWT) tabanlı bir oturum yönetimi stratejisi
    maxAge: 60 * 30 // oturum max yasi (saniye)
  },

  callbacks: { //! burada 2 tane callbacks var
    async jwt({ token, account }) { //! kullanıcının JWT (JSON Web Token) almasından önce çağrılır. 
                                    // token : oturum sırasında kullanılıcak bilgileri icerir.
                                    // account : kimlik doğrulama sağlayıcısından (örneğin, Keycloak) aldığı kimlik bilgilerini içerir. 
      if (account) { // account bilgisi varsa token nesnesine eklenir            
        token.idToken = account.id_token
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        return token
      }
      if (Date.now() < (token.expiresAt! * 1000 - 60 * 1000)) {
        return token
      } else { // account bilgisi yoksa yani oturum sonlandıysa
        try {
          const response = await requestRefreshOfAccessToken(token) // token bilgilerinin yenilenmesi için istek yapılır
          const tokens: TokenSet = await response.json()
          if (!response.ok) throw tokens

          const updatedToken: JWT = {
            ...token, // önceki token özellikleri tutuluyo
            idToken: tokens.id_token,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + (tokens.expires_in as number)),
            refreshToken: tokens.refresh_token ?? token.refreshToken,
          }
          return updatedToken
        } catch (error) {
          console.error("Error refreshing access token", error)
          return { ...token, error: "RefreshAccessTokenError" }
        }
      }
    },
    async session({ session, token }) { //!  oturum nesnesinin oluşturulması veya güncellenmesi sırasında cagrilan callback
      session.accessToken = token.accessToken
      session.error = token.error
      return session // güncellenmis oturum nesnesi
    }
  }
}
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }