// React
import React, {useEffect, useState} from 'react';
// Bootstrap
import {Card} from 'react-bootstrap';
// Stuff
import './ItemCard.css';
import {ValidUrl} from "../../utils/ValidUrl";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {ChevronDoubleDownIcon} from "@heroicons/react/outline";
import classNames from "classnames";
import {Tooltip} from "@material-ui/core";
import {Link} from "react-router-dom";

const ItemCard = ({item_id, data, dataset_name, test_id, test_select}) => {
    // Item has an image
    const [image, setImage] = useState(null);
    const [imageExits, setImageExists] = useState(false);
    // Contains metadata
    const [metadata, setMetadata] = useState(null);
    // Shows all metadata or not
    const [showMore, setShowMore] = useState(false);

    // Check whether we need to render an image
    useEffect(() => {
        let found = false;
        Object.entries(data).forEach((entry) => {
            const [key, value] = entry;
            // If image is found, remove it from the data and setImage
            if (ValidUrl(value)) {
                found = true;
                setImage(value);
                delete data[key];
                setMetadata(data);
                setImageExists(true);
            }
        })
        if (!found) {
            setImage(false);
            setMetadata(data);
        }
    }, [])

    // Divide metadata array into arrays of chunksize
    const chunks = (array, chunk_size) => {
        let results = [];
        const keys = Object.keys(array);
        const values = Object.values(array);
        while (keys.length) {
            const key = keys.splice(0, chunk_size);
            const val = values.splice(0, chunk_size);
            let new_obj = {};
            for (let i = 0; i < key.length; i++) {
                new_obj[key[i]] = val[i];
            }
            results.push(new_obj)
        }
        return results;
    }

    // If data is not loaded yet, show spinner animation
    if (metadata === null || image === null) {
        return <Spinner animation="border" role="status"/>
    }

    return (
        <Card className="item-card">
            <Card.Body style={{justifyContent: 'center', alignContent: 'center', textAlign: 'center'}}>
                <Tooltip title="Go to standard Item page.">
                    <Link to={`/dashboard/${dataset_name}/items/${item_id}`}
                          className="item-card-header">{item_id}</Link>
                </Tooltip>
                <br/>
                <Tooltip title="Show all metadata.">
                    <ChevronDoubleDownIcon
                        className={classNames("item-card-icon", {"open": showMore})}
                        onClick={() => setShowMore(!showMore)}
                    />
                </Tooltip>
            </Card.Body>
            {
                test_id === undefined ? null
                    :
                    <Tooltip title="Go to current Test.">
                        <Card.Footer className="user-card-footer" style={{textAlign: 'center'}}>
                            <Link to={`/dashboard/${dataset_name}/test/${test_id}`}
                                  className="user-card-header">{`TEST  #${test_id}`}</Link>
                        </Card.Footer>
                    </Tooltip>
            }
            {
                test_select === undefined ? null
                    :
                    <Tooltip title="Select a test to show the Recommendations stats. for.">
                        <Card.Footer className="user-card-footer" style={{textAlign: 'center'}}>
                            {test_select}
                        </Card.Footer>
                    </Tooltip>
            }
            <Card.Footer className="item-card-footer">
                <Row>
                    {
                        imageExits
                            ?
                            <Col lg="3" m="4">
                                <img className="item-card-image" src={image} alt="Item Image"/>
                            </Col>
                            :
                            null
                    }
                    {
                        showMore ?
                            chunks(metadata, 7).map((item, index) => (
                                <Col key={index} lg="2" m="2"
                                     className={`${index === 0 ? 'mt-4' : 'mt-0'} mt-lg-0 ms-lg-1`}>
                                    {
                                        Object.keys(item).map((key, index_) => (
                                            <div
                                                key={index_}
                                                className="item-card-metadata"
                                            >
                                                <div className="item-card-metadata-key">{key}</div>
                                                <div className="item-card-metadata-val">{item[key]}</div>
                                            </div>
                                        ))
                                    }
                                </Col>
                            ))
                            :
                            <Col lg="3" m="4" className="mt-4 mt-lg-0 ms-lg-1">
                                {
                                    Object.keys(metadata).slice(0, 7).map((key, index) => (
                                        <div
                                            key={index}
                                            className="item-card-metadata"
                                        >
                                            <div className="item-card-metadata-key">{key}</div>
                                            <div className="item-card-metadata-val">{metadata[key]}</div>
                                        </div>
                                    ))
                                }
                            </Col>
                    }
                </Row>
            </Card.Footer>
        </Card>
    )
}

export default ItemCard;