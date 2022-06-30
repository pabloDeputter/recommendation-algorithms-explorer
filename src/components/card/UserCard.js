// React
import React from 'react';
// Bootstrap
import {Card} from 'react-bootstrap';
// Stuff
import './UserCard.css';
import {Link} from "react-router-dom";
import {Tooltip} from "@material-ui/core"

const UserCard = ({dataset_name, user_id, data, test_id, test_select}) => {

    return (
        <Card className="user-card">
            <Tooltip title="Go to standard User page.">
                <Card.Body className="user-card-body">
                    <Link to={`/dashboard/${dataset_name}/users/${user_id}`}
                          className="user-card-header">{user_id}</Link>
                </Card.Body>
            </Tooltip>
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
                    <Tooltip title="Select a test to show the CTR for.">
                        <Card.Footer className="user-card-footer" style={{textAlign: 'center'}}>
                            {test_select}
                        </Card.Footer>
                    </Tooltip>
            }
            <Card.Footer className="user-card-footer">
                {
                    Object.keys(data).map((item, index) => (
                        <div
                            className="user-card-metadata"
                            key={index}
                        >
                            <div className="user-card-metadata-key">{item}</div>
                            <div className="user-card-metadata-val">{data[item]}</div>
                        </div>
                    ))
                }
                <div
                    className="user-card-metadata"
                >
                </div>
            </Card.Footer>
        </Card>
    )
}

export default UserCard;