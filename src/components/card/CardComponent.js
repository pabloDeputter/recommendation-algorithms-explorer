// React
import React from 'react';
import {Link} from 'react-router-dom';
// Bootstrap
import {Card} from 'react-bootstrap';
// Stuff
import './CardComponent.css';


const CardComponent = ({title, link, text, content, rest}) => {
    return (
        <Card className="card-component">
            <Card.Body className="card-component-body">
                <div className="card-component-text">
                    {link ?
                        <Link className="card-component-text-title" to={link}>{title}</Link>
                        :
                        <div className="card-component-text-title">{title}</div>}
                    <div className="card-component-text-sub">{text}</div>
                </div>
                <div className="card-component-options">
                    {rest}
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

export default CardComponent;