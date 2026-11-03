import React, {useEffect, useState} from 'react';
import {BaseUrl} from "../Constraints";
import axios from "axios";

function Login(props) {
    const [username, setUsername] = useState()
    const [password, setPassword] = useState()
    const [token, setToken] = useState()
    const [isLogin, setIsLogin] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setToken(token);
            setIsLogin(true)
        }
    }, [token]);
    function usernamehandler(e) {
        setUsername(e.target.value)
    }

    function passwordhandler(e) {
        setPassword(e.target.value)
    }

    function login() {
        let data = JSON.stringify({
          "username": "jason6",
          "password": "Jason123"
        });

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: BaseUrl + '/api/login/',
          headers: {
            'Content-Type': 'application/json'
          },
          data : data
        };

        axios.request(config)
        .then((response) => {
          console.log(JSON.stringify(response.data));
          console.log(response.data);
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
        })
        .catch((error) => {
          console.log(error);
        });
    }

    return (
         isLogin ? (<div>
                    <h1>Logout</h1>
                    <button onClick={() => {
                        localStorage.removeItem("token");
                        setToken("");
                        setIsLogin(false);
                        window.location.reload();
                    }}>Logout
                    </button>
                </div>): (<div>
            <h1>Login</h1>
            <p>
                Username: <input type="text" value={username}
                                 onChange={usernamehandler}/>
            </p>
            <p>
                Password: <input type="password" value={password}
                                 onChange={passwordhandler}/>
            </p>
            <button onClick={login}>Login</button>
            <p>Token: {token}</p>
        </div>)
    );
}

export default Login;