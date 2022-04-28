import React, { useEffect, useState } from 'react'
import { ethers, utils } from 'ethers'
import { ThemeProvider } from '@mui/material'

import abi from './contracts/Bank.json'
import { InputField, Navbar, Text, Toast } from './components'
import { theme } from './theme'

const App = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isBankOwner, setIsBankOwner] = useState(false)
  const [inputValue, setInputValue] = useState({ withdraw: '', deposit: '', bankName: ''})
  const [transacting, setTransacting] = useState({ depositing: false, withdrawing: false })
  const [bankOwnerAddress, setBankOwnerAddress] = useState(null)
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null)
  const [currentBankName, setCurrentBankName] = useState(null)
  const [customerAddress, setCustomerAddress] = useState(null)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const contractAddress =  import.meta.env.VITE_CONTRACT_ADDRESS
  const contractABI = abi.abi

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = accounts[0]
        setIsWalletConnected(true)
        setCustomerAddress(account)
      } else {
        setError('Please install a MetaMask wallet to use our bank.')
      }
    } catch (error) {
    }
  }

  const getBankName = async () => {
    try {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer)

        let bankName = await bankContract.bankName()
        bankName = utils.parseBytes32String(bankName)
        setCurrentBankName(bankName.toString())
      } else {
        setError('Please install a MetaMask wallet to use our bank')
      }
    } catch (error) {
    }
  }
  
  const setBankNameHandler = async (e) => {
    e.preventDefault()

    try {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer)
        const txn = await bankContract.setBankName(utils.formatBytes32String(inputValue.bankName))
        await txn.wait()

        getBankName()
        setInputValue(prevFormData => ({ ...prevFormData, [e.target.name]: ''}))
      } else {

        setError('Please install a MetaMask wallet to use our bank.')
      }
    } catch (error) {
    }
  }

  const getBankOwnerHandler = async () => {
    try {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer)
         let owner = await bankContract.bankOwner()
         setBankOwnerAddress(owner)

         const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
         if (owner.toLowerCase() === account.toLowerCase()) {
           setIsBankOwner(true)
         }
      } else {
        setError('Please install a MataMask wallet to use our bank!')
      }
    } catch (error) {
    }
  }

  const customerBalanceHandler = async () => {
    try {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer)

        let balance = await bankContract.getCustomerBalance()
        setCustomerTotalBalance(utils.formatEther(balance))
      } else {
        setError('Please install a MetaMask wallet to use our bank!')
      }
    } catch (error) {
    }
  }

  const handleInputChange = (e) => {

    setInputValue(prevFormData => ({ ...prevFormData, [e.target.name]: e.target.value }))
  }

  const depositMoneyHandler = async (e) => {
    if(!inputValue.deposit) return alert('Please enter a valid value!')

    try {
      e.preventDefault()

      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer)
        const txn = await bankContract.depositMoney({ value: ethers.utils.parseEther(inputValue.deposit) })
        await txn.wait()

        customerBalanceHandler()
        setInputValue(prevFormData => ({ ...prevFormData, [e.target.name]: '' }))
      } else {
        setError('Please install a MetaMask wallet to use our bank.')
      }
    } catch (error) {
    }
  }

  const withdrawMoneyHandler = async (e) => {
    if(!inputValue.withdraw) return alert('Please enter a valid value!')

    try {
      e.preventDefault()

      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer)

        let myAddress = await signer.getAddress()
        console.log('provider signer...', myAddress)

        const txn = await bankContract.withdrawMoney(myAddress, ethers.utils.parseEther(inputValue.withdraw))
        console.log('withdrawing')
        await txn.wait()

        customerBalanceHandler()
        setInputValue(prevFormData => ({ ...prevFormData, [e.target.name]: ''}))
      } else {
        setError('Please install a MetaMask wallet to use our bank!')
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    getBankName()
    getBankOwnerHandler()
    customerBalanceHandler()
  },[isWalletConnected])

  const clearError = () => setError(null)
  
  const setModalState = () => setShowModal(!showModal)

  return (
    <ThemeProvider theme={theme}>
    <Navbar isWalletConnected={isWalletConnected} connectWallet={checkIfWalletIsConnected} />
      <main>
        {error && <Toast message={error} clearToast={clearError} />}
        {transacting.depositing && showModal && <Toast message='Depositing your funds.' clearToast={setModalState} />}

        <div className='bank-name'>
          {currentBankName === '' && isBankOwner ?
          <h4>Setup the name of your bank!</h4> : <h1>{currentBankName}</h1>
          }
        </div>

        {/* <h4 className=''>Shared Wallet Balance: {}</h4> */}

        <InputField type='text' label='Deposit ETH' name='deposit' value={inputValue.deposit} onChange={handleInputChange} buttonText='Deposit' onSubmit={depositMoneyHandler} placeholder='0.00 ETH' />
        
        <InputField type='text' label='Withdraw ETH' name='withdraw' value={inputValue.withdraw} onChange={handleInputChange} buttonText='Withraw' onSubmit={withdrawMoneyHandler} placeholder='0.00 ETH' />

        <Text label='Customer Balance' content={customerTotalBalance} />
        <Text label='Bank Owner Address' content={bankOwnerAddress} />

        {isWalletConnected && <Text label='Your wallet address' content={customerAddress} />}

        {isBankOwner && <InputField type='text' label='Bank Name' name='bankName' value={inputValue.bankName} onChange={handleInputChange} buttonText='Set Bank Name' onSubmit={setBankNameHandler} placeholder='Set Bank Name' />}
      </main>
    </ThemeProvider>
  )
}

export default App