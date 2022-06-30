import React from "react";
import '../components/card/UserCard.css'

export const renderParams = (data) => {
    return (
        <div style={{textAlign: 'left', maxWidth: 500, marginTop: 5, wordBreak: 'break-word'}}
             className="user-card-metadata-key"
        >
            <div>
                {
                    Object.keys(data).map((key, index) => {
                        if (key === 'parameters') {
                            const params = (JSON.parse(data[key]));
                            return (
                                Object.keys(params).map((key_, index_) => (
                                    <div
                                        key={index_}
                                    >
                                        <div className="user-card-metadata-key">{key_}</div>
                                        <div className="user-card-metadata-val">{params[key_]}</div>
                                    </div>
                                ))
                            )
                        } else {
                            return (
                                <div
                                    key={index}
                                >
                                    <div className="user-card-metadata-key">{key}</div>
                                    <div className="user-card-metadata-val">{data[key]}</div>
                                </div>
                            )
                        }
                    })
                }
            </div>
        </div>
    )
}