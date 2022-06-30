import React, {useEffect, useState} from 'react';
import axios from 'axios';

axios.defaults.baseURL = '/api';


// url = api call url pasted after baseURL '/api'
// method = POST, GET, PUT, DELETE, ...
// body, header = optional fields
export const useAxios = ({url, method, body = null, header = null}) => {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState('');
    const [fetching, setFetching] = useState(true);

    const fetchData = () => {
        axios[method](url, JSON.parse(body), JSON.parse(header))
            .then((response) => {
                setResponse(response.data);
            })
            .catch((error) => {
                setError(error);
            })
            .finally(() => {
                setFetching(false);
            })
    }
    useEffect(() => {
        fetchData();
    }, [method, url, body, header]);


    return {response, error, fetching};
}

export const useAxiosClick = () => {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState('');
    const [fetching, setFetching] = useState(true);

    const operation = async (params) => {
        try {
            setFetching(true);
            const result = await axios.request(params);
            setResponse(result.data);
        } catch (error) {
            setError(error);
        } finally {
            setFetching(false);
        }
    }


    return {response, error, fetching, operation};
}

// export const useAxiosClick = async () => {
//     const [ response, setResponse ] = useState(null);
//     const [ error, setError ] = useState('');
//     const [ fetching, setFetching ] = useState(true);
//
//     const operation = async({ url, method, body = null, header = null }) => {
//         setResponse(await axios[method](url, JSON.parse(body), JSON.parse(header)))
//         console.log(response);
//
//         /*
//             x.then((response) => {
//                 setResponse(response.data);
//             })
//             .catch((error) => {
//                 setError(error);
//             })
//             .finally(() => {
//                 setFetching(false);
//             })*/
//     }
//
//     // if (response === null){
//     //     return {response, error, true, operation}
//     // }
//
//
//     return { response, error, fetching, operation };
// }

// const [ { data, loading, error }, fetch ] = useAxios(
//     {
//         url : 'user?email:eq='.concat(email.toLowerCase()).concat("&password:eq=").concat(password),
//         method : 'get'
//     },
//     // Otherwise fetch while typing
//     {
//       manual : true
//     }
// )