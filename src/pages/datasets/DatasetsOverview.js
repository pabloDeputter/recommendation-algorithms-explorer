// React
import React, {useEffect, useState} from 'react';
// Bootstrap
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
// Stuff
import {CardComponent, DatasetCard} from '../../components/index';
import axios from "axios";
// storage system
import {useNavigate} from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";


const DatasetsOverview = ({props}) => {

    const navigate = useNavigate()
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    //let array = [...Array(50).keys()];
    const [array, setArray] = useState([])
    const [uploadingSets, setUploadingSets] = useState([])
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get('get_datasets_info',
            {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            })
            .then(res => res.data)
            // .catch(error => console.log(error))
            .then(data => {
                setArray(data['datasets']);
                setUploadingSets(data['uploading']);
            })
            .catch((error) => {
                return error.data
            })
            .finally(() => setLoading(false))
    }, []);

    return (
        <Container fluid className="mt-0 mt-lg-4">
            <CardComponent
                title='Your Datasets'
                link=''
                text='This page contains an overview of all your added datasets. By clicking on the dataset you will find the data in this dataset.'
                content=
                    {
                        <Container fluid>
                            {loading ? <Spinner animation="border" role="status"/> : <>
                                <Row>
                                    {array.map((item, index) => (
                                        <Col lg="2" m="4" className="mb-4 mt-lg-0" key={index}>
                                            <DatasetCard name={item['name']} total_items={item['items']}
                                                         total_users={item['users']}/>
                                        </Col>
                                    ))}
                                    {uploadingSets.map((item, index) => (
                                        <Col lg="2" m="4" className="mb-4 mt-lg-0" key={index}>
                                            <DatasetCard name={item} loading={true}/>
                                        </Col>
                                    ))}
                                </Row>
                            </>}
                        </Container>
                    }
                rest=''
            />
        </Container>
    );
}

export default DatasetsOverview;