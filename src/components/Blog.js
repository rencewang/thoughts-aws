import { DataStore } from '@aws-amplify/datastore';
import { Hub } from '@aws-amplify/core';
import { useEffect, useState, useRef } from 'react';
// import { Storage } from '@aws-amplify/storage';
import { Amplify } from 'aws-amplify';

import { Slider } from '@mui/material';
import { marked } from 'marked';
import { sanitize } from 'dompurify';

import { Tag, Post } from '../models';
import '../style.css';

import awsconfig from '../aws-exports';
Amplify.configure(awsconfig);

function Blog() {
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [allposts, setAllPosts] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [audios, setAudios] = useState([]);

  const [currentPost, setCurrentPost] = useState({ content: '' });
  const [currentHTML, setCurrentHTML] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [currentAudio, setCurrentAudio] = useState('');

  // hook for grabbing data, only run once **************************************
  useEffect(() => {
    const start = async () => {
      await DataStore.start();
    };

    const getData = async () => {
      try {
        // query all posts and filter by tags
        const posts = await DataStore.query(Post);
        const sortedPosts = posts
          .slice()
          .sort((a, b) => b.time.localeCompare(a.time));
        setDisplayedPosts(sortedPosts);

        const thoughts = sortedPosts.filter((p) => {
          return p.tag === Tag.THOUGHTS;
        });
        const playlists = sortedPosts.filter((p) => {
          return p.tag === Tag.PLAYLISTS;
        });
        const quotes = sortedPosts.filter((p) => {
          return p.tag === Tag.QUOTES;
        });
        const audios = sortedPosts.filter((p) => {
          return p.tag === Tag.AUDIO;
        });

        setAllPosts(sortedPosts);
        setThoughts(thoughts);
        setPlaylists(playlists);
        setQuotes(quotes);
        setAudios(audios);

        // get bucket content and save to state
        // Storage.list('').then((result) => {
        //   setAudioList(result);
        // });
      } catch (err) {
        console.error(err);
      }
    };

    // listen for datastore to be fully loaded, then make datastore queries
    const listener = Hub.listen('datastore', async (hubData) => {
      const { event } = hubData.payload;
      if (event === 'ready') {
        getData();
      }
    });

    start();
    return () => {
      listener();
    };
  }, []);

  // hook for changing post content that is displayed **************************************
  useEffect(() => {
    const html = marked.parse(currentPost.content);
    const sanitized = html
      ? sanitize(html)
      : "<p>This is the wall onto which I throw my random daily ideas and playlists and audio clips and quotes. It's built with Create React App and AWS, and the design is inspired by type foundry websites, so you can edit the text and change its appearance :)</p>";
    setCurrentHTML(sanitized);
    setCurrentTime(currentPost.time ? convertDate(currentPost, 'words') : '');
    setCurrentAudio(currentPost.audio ? currentPost.audio : '');
    if (currentPost.tag === Tag.AUDIO) {
      setCurrentTag('an Audio');
    } else if (currentPost.tag === Tag.PLAYLISTS) {
      setCurrentTag('a Playlist');
    } else if (currentPost.tag === Tag.QUOTES) {
      setCurrentTag('a Quote');
    } else if (currentPost.tag === Tag.THOUGHTS) {
      setCurrentTag('a Thought');
    }
  }, [currentPost]);

  const listRef = useRef(null);
  const buttonRef = useRef(null);
  const overallRef = useRef(null);

  const [fontSize, setFontSize] = useState([100]);
  const [letterSpacing, setLetterSpacing] = useState([-0.05]);
  const [lineHeight, setLineHeight] = useState([0.9]);

  // mobile button to show list of posts
  const showList = () => {
    listRef.current.classList.toggle('mobile-show');
    buttonRef.current.classList.toggle('close-button-show');
  };

  // tag buttons to filter posts **************************************
  const filterPosts = (tag) => {
    if (!listRef.current.classList.contains('post-list-mobile-show')) {
      listRef.current.classList.add('mobile-show');
      buttonRef.current.classList.add('close-button-show');
    }
    if (tag === 'thoughts') {
      setDisplayedPosts(thoughts);
    } else if (tag === 'playlists') {
      setDisplayedPosts(playlists);
    } else if (tag === 'quotes') {
      setDisplayedPosts(quotes);
    } else if (tag === 'all') {
      setDisplayedPosts(allposts);
    } else if (tag === 'audios') {
      setDisplayedPosts(audios);
    }
  };

  // make sure mobile height sizing is correct **************************************
  function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return { width, height };
  }

  function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(
      getWindowDimensions()
    );
    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
      window.addEventListener('resize', handleResize);
      if (windowDimensions.width < 850) {
        setFontSize([65]);
      }
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    return windowDimensions;
  }

  const { height, width } = useWindowDimensions();
  useEffect(() => {
    overallRef.current.style.height = height + 'px';
  }, [height, width]);

  // date conversion for proper display in timezones **************************************
  const convertDate = (post, type) => {
    const date = new Date(post.time);
    const createdAt = new Date(post.createdAt);
    let words =
      date
        .toLocaleString('en-GB', { timeZone: 'America/New_York' })
        .substring(0, 2) +
      ' ' +
      date.toLocaleString('default', { month: 'long' }) +
      ' ' +
      date.getFullYear() +
      ' ' +
      date
        .toLocaleString('en-GB', { timeZone: 'America/New_York' })
        .substring(12, 18) +
      createdAt
        .toLocaleString('en-GB', { timeZone: 'America/New_York' })
        .substring(18, 20);
    let numeric =
      date
        .toLocaleString('en-GB', { timeZone: 'America/New_York' })
        .substring(0, 18) +
      createdAt
        .toLocaleString('en-GB', { timeZone: 'America/New_York' })
        .substring(18, 20);
    return type === 'numeric' ? numeric : words;
  };

  return (
    <div id="overall" ref={overallRef}>
      <nav id="post-nav">
        <button onClick={(e) => filterPosts('all')}>All</button>
        <button onClick={(e) => filterPosts('thoughts')}>Thoughts</button>
        {/* <button onClick={(e) => filterPosts('playlists')}>Playlists</button> */}
        <button onClick={(e) => filterPosts('quotes')}>Quotes</button>
        <button onClick={(e) => filterPosts('audios')}>Audio</button>
      </nav>

      <div id="post-list" ref={listRef}>
        {displayedPosts.map((post) => (
          <h2 key={post.id}>
            <button onClick={(e) => setCurrentPost(post)}>
              {post.time ? convertDate(post, 'numeric') : 'a note'}
            </button>
          </h2>
        ))}
      </div>

      <button
        className="post-list-mobile-close"
        ref={buttonRef}
        onClick={(e) => showList()}
      >
        close
      </button>

      <div id="post-content">
        <div id="post-area">
          <div
            id="post-markdown"
            contentEditable={true}
            spellCheck={false}
            style={{
              fontSize: `${fontSize}px`,
              letterSpacing: `${letterSpacing}em`,
              lineHeight: `${lineHeight}`,
            }}
            dangerouslySetInnerHTML={{ __html: currentHTML }}
          />

          {currentAudio && (
            <div>
              <audio controls src={currentAudio} type="audio/mpeg"></audio>
            </div>
          )}

          {currentTag && (
            <div id="post-time" style={{ marginBottom: '30px' }}>
              Recorded on {currentTime} as {currentTag}
            </div>
          )}
        </div>

        <div id="post-resize">
          <div>
            <div className="icon">font size</div>
            <div className="slider">
              <Slider
                value={fontSize}
                defaultValue={100}
                min={30}
                max={200}
                step={1}
                onChange={(e, data) => setFontSize(data)}
              />
            </div>
            <div className="label">{fontSize}px</div>
          </div>

          <div>
            <div className="icon">letter spacing</div>
            <div className="slider">
              <Slider
                value={letterSpacing}
                defaultValue={0}
                min={-0.1}
                max={0.1}
                step={0.01}
                onChange={(e, data) => setLetterSpacing(data)}
              />
            </div>
            <div className="label">{Number(letterSpacing).toFixed(2)}</div>
          </div>

          <div>
            <div className="icon">line height</div>
            <div className="slider">
              <Slider
                value={lineHeight}
                defaultValue={1}
                min={0.5}
                max={3}
                step={0.01}
                onChange={(e, data) => setLineHeight(data)}
              />
            </div>
            <div className="label">{Number(lineHeight).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blog;
