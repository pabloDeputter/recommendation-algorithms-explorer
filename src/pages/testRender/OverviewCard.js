import React, {useState} from 'react';
import {Card, Col, Row} from "react-bootstrap";
import './TestCard.css'
import classNames from "classnames";
import {ChevronDoubleDownIcon} from "@heroicons/react/outline";
import photo from "../../img/test_render.png"

const TestCard = ({test_id, startDate, endDate, stepSize, topK, algorithms}) => {

    const [renderAlgorithms, setRenderAlgorithms] = useState(false);
    const handleAlgorithmsButton = () => {
        setRenderAlgorithms(!renderAlgorithms);
    }

    let h = window.innerHeight;
    let w = window.innerWidth;

    return (
        <Card className="test-card">
            <Card.Body className="test-card-body">
                <div className="test-card-header">Test data of test {test_id}</div>
            </Card.Body>
            <div className="test-card-divider"/>
            <Card.Footer className=".test-card-body ">
                <Row>
                    <Col xxl="9" lg="8" m="4">
                        <div>
                            You have been directed to the test page. This page contains all information/data about
                            test {test_id}. Below you will find the parameters as well as the algorithms (and their
                            parameters) used in this test. It is possible to click on graphs to get a better view.
                            If you click on an item or user from this page you will be taken to the item/user page
                            with additional data related to the home test.
                        </div>
                    </Col>
                    {(w >= 400) ?
                        <Col xxl="2" lg="2" m="4">
                            <img className="test-card-img" src={photo} alt="Logo"/>
                        </Col>
                        : <br/>
                    }

                </Row>
            </Card.Footer>
            <div className="test-card-divider"/>
            <Card.Footer className="test-card-footer">
                <Row>
                    <Col>
                        <div className="test-card-metadata">
                            <div className="test-card-metadata-key">Interval</div>
                            <div className="test-card-metadata-val">{startDate} - {endDate}</div>
                        </div>
                    </Col>
                    <Col>
                        <div className="test-card-metadata">
                            <div className="test-card-metadata-key">Step Size</div>
                            <div className="test-card-metadata-val">{stepSize}</div>
                        </div>
                        <div className="test-card-metadata">
                            <div className="test-card-metadata-key">Topk</div>
                            <div className="test-card-metadata-val">{topK}</div>
                        </div>
                    </Col>
                </Row>


                <div className="test-card-button" onClick={handleAlgorithmsButton}>
                    <ChevronDoubleDownIcon className={classNames("test-card-icon", {"open": renderAlgorithms})}/>
                </div>
            </Card.Footer>
            <Card.Footer className={classNames("test-card-algorithms", {"open": renderAlgorithms})}>
                <Row>
                    {algorithms.map((item, index) => (
                            <Col lg="2" m="4" className="mb-4 mt-lg-0" key={index}>
                                <Card className="test-card">
                                    <Card.Body className="test-card-body">
                                        <div className="test-card-header">{`${item['name']} #id:${item['id']}`}</div>
                                    </Card.Body>
                                    <div className="test-card-divider"/>
                                    <Card.Footer className="test-card-footer">
                                        {Object.keys(JSON.parse(item['parameters'])).map((key, index) => (
                                            <div className="test-card-metadata">
                                                <div className="test-card-metadata-key">{key}</div>
                                                <div
                                                    className="test-card-metadata-val">{JSON.parse(item['parameters'])[key]}</div>
                                            </div>
                                        ))}
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    )}
                </Row>
            </Card.Footer>
        </Card>
    )
}

export default TestCard;