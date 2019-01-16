import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import './FileDownload.css'

function getFormInputs() {
    const {queryParams} = this.props;

    if (queryParams === undefined) {
        return null;
    }

    return Object.keys(queryParams).map((name, index) => {
        return (
            <input
                key={index}
                name={name}
                type="hidden"
                value={queryParams[name]}
            />
        );
    });
}

export default class FileDownload extends Component {

    static propTypes = {
        actionPath: PropTypes.string.isRequired,
        method: PropTypes.string,
        onDownloadComplete: PropTypes.func.isRequired,
        queryParams: PropTypes.object
    };

    static defaultProps = {
        method: 'GET'
    };

    componentDidMount() {
        ReactDOM.findDOMNode(this).submit();
        this.props.onDownloadComplete();
    }

    render() {
        const {actionPath, method} = this.props;

        return (
            <form
                action={actionPath}
                className="FileDownload-hidden"
                method={method}
            >
                {getFormInputs.call(this)}
            </form>
        );
    }
}
