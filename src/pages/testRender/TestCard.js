import React, {useState} from 'react';
import {Card} from "react-bootstrap";
import './TestCard.css'
import classNames from "classnames";
import {ChevronDoubleDownIcon} from "@heroicons/react/outline";

const TestCard = ({test_id, startDate, endDate, stepSize, algorithms}) => {
    const [renderAlgorithms, setRenderAlgorithms] = useState(false);
    const handleAlgorithmsButton = () => {
        setRenderAlgorithms(!renderAlgorithms);
    }

    return (
        <Card className="test-card">
            <Card.Body className="test-card-body">
                <div className="test-card-header">{test_id}</div>
            </Card.Body>
            <div className="test-card-divider"/>
            <Card.Footer className="test-card-footer">
                <div className="test-card-metadata">
                    <div className="test-card-metadata-key">Interval</div>
                    <div className="test-card-metadata-val">{startDate} - {endDate}</div>
                </div>
                <div className="test-card-metadata">
                    <div className="test-card-metadata-key">Step Size</div>
                    <div className="test-card-metadata-val">{stepSize}</div>
                </div>
                <div className="test-card-button" onClick={handleAlgorithmsButton}>
                    <ChevronDoubleDownIcon className={classNames("test-card-icon", {"open": renderAlgorithms})}/>
                </div>
            </Card.Footer>
            <Card.Footer className={classNames("test-card-algorithms", {"open": renderAlgorithms})}>
                {
                    algorithms.map((item, index) => (
                        <div key={index} className="test-card-algorithm">
                            <div className="test-card-algorithm-name">{item['name']}</div>
                            {Object.keys(item['parameters'] === null ? {} : item['parameters']).map((param, index_) => (
                                <div key={index_} className="test-card-parameter">
                                    <div  className="test-card-parameter-key">{param}</div>
                                </div>
                            ))}
                        </div>
                    ))
                }
            </Card.Footer>
        </Card>
    )
}

export default TestCard;