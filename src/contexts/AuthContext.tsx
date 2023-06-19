import { createContext, ReactNode, useState } from 'react'

import Router from 'next/router'

import { destroyCookie, setCookie } from 'nookies'

import { api } from '@/services/api'

interface UserProps {
  id: string
  name: string
  email: string
}

interface SignInProps {
  email: string
  password: string
}

interface AuthContextProps {
  user: UserProps
  isAuthenticated: boolean
  signIn: (credentials: SignInProps) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext({} as AuthContextProps)

interface AuthProviderProps {
  children: ReactNode
}

function useUserData() {
  const [user, setUser] = useState<UserProps>()

  const insert = (currentUser: UserProps) => {
    setUser(currentUser)
  }

  return { user, insert }
}

export function AuthContextProvider({ children }: AuthProviderProps) {
  const { user, insert } = useUserData()

  const currentUser = user as UserProps

  const isAuthenticated = !!user

  async function signIn({ email, password }: SignInProps) {
    try {
      const response = await api.post('/login', { email, password })

      const { id, name, token } = response.data

      setCookie(undefined, process.env.NEXT_PUBLIC_KEY_TOKEN as string, token, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      insert({
        id,
        name,
        email,
      })

      api.defaults.headers.Authorization = `Bearer ${token}`

      Router.push('/dashboard')
    } catch (error) {
      console.log('Error ao acessar ', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{ signIn, isAuthenticated, user: currentUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function signOut() {
  try {
    destroyCookie(undefined, process.env.KEY_TOKEN as string)
    Router.push('/')
  } catch (error) {
    console.log('Error ao deslogar')
  }
}