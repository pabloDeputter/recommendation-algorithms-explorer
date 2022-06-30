// React
import React, {useState} from 'react';
import {Link} from "react-router-dom";
// Bootstrap
import {Card, Modal} from "react-bootstrap";
// Stuff
import './DataSetCard.css';
import Spinner from "react-bootstrap/Spinner";
import {TrashIcon} from "@heroicons/react/solid";
import Button from "react-bootstrap/Button";
import axios from "axios";

const DatasetCard = ({name, total_items, total_users, loading = false}) => {
    const [show, setShow] = useState(false);
    const [deleting, setDeleting] = useState(false);

    return (
        <>
            <Card className="dataset-card">
                <Card.Body className="dataset-card-body d-flex justify-content-between align-items-center">
                    {loading || deleting ? <div className={"dataset-card-header"}>{name}</div> :
                        <><Link className="dataset-card-header" to={`/dashboard/dataset/${name}`}>{name}</Link>
                            <TrashIcon className='sidebar-icon' onClick={() => setShow(!show)}
                                       style={{cursor: 'pointer', color: 'lightgray'}}/></>}
                </Card.Body>
                <div className="dataset-card-divider"/>
                <Card.Footer className="dataset-card-footer">
                    {loading || deleting ? <Spinner animation="border" role="status"/> :
                        <>
                            <div className="dataset-card-metadata">
                                <div className="dataset-card-metadata-key">Total items</div>
                                <div className="dataset-card-metadata-val">{total_items}</div>
                            </div>
                            <div className="dataset-card-metadata">
                                <div className="dataset-card-metadata-key">Total users</div>
                                <div className="dataset-card-metadata-val">{total_users}</div>
                            </div>
                        </>
                    }
                </Card.Footer>
            </Card>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Body>Are you sure you want to delete {name}?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>
                        Close
                    </Button>
                    <Button variant="danger" type={"submit"} onClick={() => {
                        // axios.delete(`/datasets/${name}`).then(() => window.location.reload())
                        setShow(false);
                        setDeleting(true);
                        axios.get(`/delete_dataset/${name}`, {
                            headers: {
                                Authorization: "Bearer " + localStorage.getItem("token")
                            }
                        }).then(() => window.location.reload())
                            .catch(() => setDeleting(false))
                    }}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default DatasetCard;