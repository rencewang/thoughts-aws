import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Auth } from 'aws-amplify'

import Login from './Auth'
import Blog from './Blog'
import Create from './Create'

import '../style.css'

function Main() {

    const [user, setUser] = useState({})
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const getData = async () => {
            try {        
                // fetch the current signed in user
                // then, check to see if they're a member of the admin user group
                const user = await Auth.currentAuthenticatedUser()
                setIsAdmin(user.signInUserSession.accessToken.payload['cognito:groups'].includes('admin'))
                setUser(user)

            } catch (err) {
                console.error(err)
            }
        }    

        getData()

    }, [])    

    return (
        <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/create' element={<Create user={isAdmin} />} />
            <Route exact path='/' element={<Blog />} />
        </Routes>
    )
}

export default Main