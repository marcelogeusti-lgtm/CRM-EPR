'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Box, Lock, Mail, ArrowRight, Github } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (isLogin) {
        const res = await login(formData)
        if (res?.error) setError(res.error)
      } else {
        const res = await signup(formData)
        if (res?.error) setError(res.error)
        if (res?.success) {
          setSuccess(res.success)
          setIsLogin(true) // Switch to login after successful registration
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-100 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md p-8 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Box className="size-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Nexus
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLogin 
                ? 'Insira suas credenciais para acessar o CRM' 
                : 'Preencha os dados abaixo para começar'}
            </p>
          </div>

          <form action={handleSubmit} className="space-y-4">
            
            {/* Error / Success Messages */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                {success}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Senha</label>
                {isLogin && <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Esqueceu?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar no Nexus' : 'Criar Conta'}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#222] text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setSuccess(null)
              }}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin 
                ? 'Não tem uma conta? Cadastre-se' 
                : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
