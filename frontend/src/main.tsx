import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './store'
import theme from './styles/theme'
import './styles/index.css'
import { WalletProvider } from './hooks/useWalletContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <WalletProvider>
            <App />
          </WalletProvider>
        </BrowserRouter>
      </ChakraProvider>
    </Provider>
  </React.StrictMode>,
) 