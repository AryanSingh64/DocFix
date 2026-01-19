// Import createServerClient: Creates a Supabase client optimized for Next.js server-side usage
import { createServerClient } from '@supabase/auth-helpers-nextjs'
// Import NextResponse: Used to create and modify HTTP responses in middleware
import { NextResponse } from 'next/server'

// MIDDLEWARE FUNCTION
// This function runs BEFORE any page loads (intercepts all requests)
// 'request' parameter: contains all information about the incoming HTTP request
export async function middleware(request) {
//like we are going to /dashboard so it says middleware running for /dashboard
    console.log('🔥 Middleware running for:', request.nextUrl.pathname)

    // STEP 1: Create initial response that says "proceed to next step"
    // NextResponse.next(): tells Next.js to continue processing the request normally
    // We pass the original request headers along
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // STEP 2: connecting to our database
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            // COOKIE HANDLING: Supabase needs to read/write cookies to manage auth tokens
            cookies: {
                // getAll(): Provides a way for Supabase to READ all cookies from the request
                // This allows Supabase to find existing auth tokens
                getAll() {
                    return request.cookies.getAll()
                },

                // setAll(): Provides a way for Supabase to WRITE/UPDATE cookies
                // cookiesToSet: array of cookie objects that Supabase wants to update
                setAll(cookiesToSet) {
                    // FIRST LOOP: Set cookies on the REQUEST object
                    // This ensures any code running after this sees the updated cookies
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))

                    // Recreate the response object to ensure cookie changes are captured
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })

                    // SECOND LOOP: Set cookies on the RESPONSE object
                    // This ensures the browser receives the updated cookies
                    // 'options' includes settings like expiration, httpOnly, secure, etc.
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // STEP 3: Check if user has an active session (are they logged in?)
    // Destructuring: extracts 'session' from the nested response object
    const { data: { session } } = await supabase.auth.getSession()

    // Log whether a session was found
    // !!session: converts session to boolean (true if exists, false if null/undefined)
    console.log('🔥 Middleware session found:', !!session)

    // STEP 4: Return the response, allowing the request to proceed
    // By now, auth cookies have been refreshed if needed
    return response
}

// CONFIGURATION: Define which routes this middleware should run on
export const config = {
    // matcher: array of patterns that determine when middleware runs
    // This regex pattern means: "Run on ALL routes EXCEPT:"
    //   - _next/static (Next.js static files like CSS/JS)
    //   - _next/image (Next.js image optimization)
    //   - favicon.ico (site icon)
    // This prevents middleware from running unnecessarily on static files (performance boost)
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
