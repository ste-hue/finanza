import React from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

interface AuthComponentProps {
  darkMode?: boolean
}

export const AuthComponent: React.FC<AuthComponentProps> = ({ darkMode = false }) => {
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <Card className={`w-full max-w-md ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-xl'
      }`}>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              ORTI Finance
            </h1>
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Accedi per gestire i dati finanziari
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4285f4', // Google Blue
                    brandAccent: '#3367d6',
                    brandButtonText: 'white',
                    defaultButtonBackground: darkMode ? '#374151' : '#f9fafb',
                    defaultButtonBackgroundHover: darkMode ? '#4b5563' : '#f3f4f6',
                    inputBackground: darkMode ? '#374151' : 'white',
                    inputBorder: darkMode ? '#4b5563' : '#d1d5db',
                    inputBorderHover: darkMode ? '#6b7280' : '#9ca3af',
                    inputBorderFocus: '#4285f4', // Google Blue
                    inputText: darkMode ? 'white' : '#111827',
                    inputLabelText: darkMode ? '#d1d5db' : '#374151',
                  },
                },
              },
              className: {
                container: darkMode ? 'text-white' : 'text-gray-900',
                button: 'font-medium transition-all duration-200 hover:shadow-lg',
                input: 'transition-all duration-200',
              },
            }}
            theme={darkMode ? 'dark' : 'default'}
            providers={['google']}
            localization={{
              variables: {
                sign_in: {
                  social_provider_text: 'Accedi con {{provider}}',
                  email_label: 'Email aziendale (opzionale)',
                  password_label: 'Password',
                  button_label: 'Accedi con email',
                  loading_button_label: 'Accesso in corso...',
                  link_text: 'Hai già un account? Accedi',
                  email_input_placeholder: 'Il tuo indirizzo email',
                  password_input_placeholder: 'La tua password',
                },
                sign_up: {
                  social_provider_text: 'Registrati con {{provider}}',
                  email_label: 'Email aziendale (opzionale)',
                  password_label: 'Password',
                  button_label: 'Registrati con email',
                  loading_button_label: 'Registrazione in corso...',
                  link_text: 'Non hai un account? Registrati',
                  email_input_placeholder: 'Il tuo indirizzo email',
                  password_input_placeholder: 'Crea una password sicura',
                },
                magic_link: {
                  email_input_label: 'Email aziendale',
                  email_input_placeholder: 'Il tuo indirizzo email',
                  button_label: 'Invia magic link',
                  loading_button_label: 'Invio magic link...',
                  link_text: 'Invia un magic link via email',
                  confirmation_text: 'Controlla la tua email per il link di accesso',
                },
                forgotten_password: {
                  email_label: 'Email aziendale',
                  button_label: 'Invia istruzioni',
                  loading_button_label: 'Invio istruzioni...',
                  link_text: 'Password dimenticata?',
                  confirmation_text: 'Controlla la tua email per le istruzioni di reset',
                },
              },
            }}
            redirectTo={window.location.origin}
            onlyThirdPartyProviders={false}
            magicLink={true}
            showLinks={true}
            view="sign_in"
          />

          <div className={`mt-6 text-center text-xs ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <p>🔒 Dati protetti con crittografia end-to-end</p>
            <p className="mt-1">Per assistenza contatta l'amministratore IT</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthComponent