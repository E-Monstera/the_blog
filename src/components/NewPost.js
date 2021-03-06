import React from 'react';
import '../style/style.scss';
import { useState, useEffect, useContext } from 'react';
import { getAllCategories, postNewPost, getPost, editPost } from '../services/user.service'
import { useHistory } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { UserContext } from '../App';
import EditorSnip from './EditorSnip';

const SignUp = (props) => {


    let history = useHistory();


    // Grab UserContext from app.js and destructure currentUser from it
    const userContext = useContext(UserContext);
    const { currentUser } = userContext;

    // State to hold the categories and errors
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({
        title: '',
        content: ''
    });

    // State to hold the newpost
    const [newPost, setNewPost] = useState({
        author: '',             //To be set by useEffect from currentUser, or by edit post
        title: '',
        content: '',
        published: false,
        category: '',
        subcategory: '',
    })

    // Triggered when user types in a title or selects a radiobutton
    const handleChange = (e) => {

        // User checked a 'published' button, set to appropriate value
        if (e.target.type === 'radio' && e.target.name === 'published') {
            if (e.target.id === 'yes') {
                setNewPost({
                    ...newPost,
                    published: true
                })
            } else {
                setNewPost({
                    ...newPost,
                    published: false
                })
            }
        // User checked a subcategory radio button, set the appropriate state
        } else if (e.target.type === 'radio' && e.target.name === 'subcategory') {
            setNewPost({
                ...newPost,
                category: e.target.className,
                subcategory: e.target.id
            })
        } else {
            // User is changing the title
            setNewPost({
                ...newPost,
                [e.target.id]: e.target.value
            })
        }
    }

    // For tinymce controlled input editor - Triggered within <EditorSnip> component
    const handleTextEdit = (text) => {
        console.log(text)
        setNewPost({
            ...newPost,
            content: text
        });
    }

    // Triggered when user submits the new post
    const handleSubmit = (e) => {
        // The radio buttons are set to required, so they do not need to be validated
        e.preventDefault();
        let passed = true;  //Default flag, if below validation fails it is set to false

        // Verify title is at least 3 characters long and less than 150 characters
        if ((newPost.title.length < 3 || newPost.title.length >= 150) || newPost.content.length < 10) {

            passed = false;     //Indicates authentication failed

            // Default values to hold error until setErrors
            let titleErr = '';
            let contentErr = '';

            if (newPost.title.length < 3 || newPost.title.length >= 150) {
                titleErr = 'Title must be between 3 and 150 characters'
            }
            if (newPost.content.length < 10) {
                contentErr = 'Content must be at least 10 characters'
            }
            setErrors({
                title: titleErr,
                content: contentErr,
            })
        }

        if (passed) {
            // Validation passed, submit post to API
            if (props.match.params.postid) {
                // Presence of postid indicates that the user is editting a post
                editPost(props.match.params.postid, newPost)
                    .then(response => {
                        if (response.status === 200) {
                            history.push('/managePosts')    //Redirect user
                        }
                    })
                    .catch(error => {
                        if (error.response.status === 400) {
                            console.log(error.response.data.errArr)
                            // postid is not found, redirect user to manageposts page so they can select correct post
                            history.push('/managePosts')    //Redirect user
                        } else {
                            console.log(error.response)
                        }

                    })
            } else {
                // Creating new post
                postNewPost(newPost)
                    .then(response => {
                        if (response.status === 200) {
                            history.push('/managePosts')    //Redirect user
                        }
                    })
                    .catch(error => {
                        if (error.response.status === 400) {
                            console.log(error.response.data.errArr)
                        } else {
                            console.log(error.response)
                        }

                    })

            }
        }
    }

    // Used to set post data
    // if user is making a new post, grab their userid
    // if user is editting a post, grab all their previous data
    useEffect(() => {
        if (props.match.params.postid === undefined) {
            // User is submitting a new post
            if (currentUser === '') {
                return;     //currentUser hasn't been set yet, wait for it to be set
            } else {
                setNewPost({
                    ...newPost,
                    author: currentUser.id,
                })
            }
        } else {
            // User is editting a post so grab all previous data
            getPost(props.match.params.postid)
                .then(response => {
                    setNewPost({
                        author: response.data.author._id,
                        title: response.data.title,
                        content: response.data.content,
                        published: response.data.published,
                        category: response.data.category._id,
                        subcategory: response.data.subcategory,
                        date: response.data.date
                    })
                })
                .catch(error => {
                    console.log(error.response.status)
                    if (error.response.status === 404) {
                        // No such post found
                    } else {
                        console.log(error)
                    }
                })
        }
    }, [currentUser])

    // Effect hook to grab the categories from the backend
    useEffect(() => {
        getAllCategories()
            .then(response => {
                setCategories(response.data.categories);
            })
            .catch(error => console.log(error))
    }, [])

    return (
        <div className='form-page-wrapper post-form-wrapper'>
            <div className='form-wrapper new-post-wrapper'>

                {props.match.params.postid === undefined ? <h1>New Post</h1> : <h1>Edit Post</h1>}

                <form onSubmit={handleSubmit}>

                    <div className='form-element'>
                        <label htmlFor='title'>Title</label>
                        <input type='text' id='title' name='title' value={newPost.title} required onChange={handleChange}></input>
                        <span className='errors'>{errors.title}</span>
                    </div>

                    {/* The tinymce editor */}
                    <EditorSnip handleTextEdit={handleTextEdit} contentValue={newPost.content} />

                    {/* Radio buttons to determine whether the user wants to publish the post now or later */}
                    <div className='form-radios'>
                        <div className='form-element form-publish-radios'>
                            <p>Do you want to publish this post immediately?</p>
                            <div className='signup-radios'>
                                <label htmlFor='yes'>Yes</label>
                                <input type='radio' id='yes' name='published' checked={newPost.published === true} required onChange={handleChange}></input>
                            </div>
                            <div className='signup-radios'>
                                <label htmlFor='no'>No</label>
                                <input type='radio' id='no' name='published' checked={newPost.published === false} required onChange={handleChange}></input>
                            </div>
                        </div>

                        {/* Radio buttons allowing the user to select a subcategory for their post */}
                        <div className='form-element '>
                            <p>Choose a subcategory</p>
                            {categories.map(cat => {
                                return (
                                    <div className='cat-radio-container' key={cat._id}>
                                        <label className='cat-title'>{cat.name}</label>
                                        {cat.subcategories.length === 0 ? <p className='subcat-radio'>No Subcategories Found</p> : null}
                                        {cat.subcategories.map(subcat => {
                                            return (
                                                <div className='subcat-radio' key={subcat}>
                                                    <label htmlFor={subcat}>{subcat}</label>
                                                    <input type='radio' id={subcat} name='subcategory' checked={newPost.subcategory === subcat} className={cat._id} required onChange={handleChange}></input>
                                                </div>
                                            )
                                        })
                                        }
                                    </div>
                                )
                            })}
                            {/* Link that directs user to a page where they can add categories */}
                            <Link to='/manageCategories' className='button-style link-button'>Manage Categories</Link>
                        </div>
                    </div>
                    <button className='button-style' type='submit'>Submit</button>
                </form>
            </div>
        </div>
    )

}

export default SignUp;