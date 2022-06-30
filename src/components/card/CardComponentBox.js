// React
import React from 'react';
// Bootstrap
import {Card} from 'react-bootstrap';
// Stuff
import './CardComponent.css';
import './UserCard.css'


const CardComponentBox = ({title, text, content}) => {
    return (
        <Card className="card-component">
            <Card.Body className="card-component-body">
                <div className="card-component-text">
                    <div className="card-component-text-title justify-content-center align-text-center">{title}</div>
                    <div>
                    </div>
                </div>
            </Card.Body>
            <div className="card-component-divider"/>
            <Card.Footer className="card-component-footer">
                <div className="card-component-content">
                    {content}
                </div>
            </Card.Footer>
        </Card>
    )
}

export default CardComponentBox;